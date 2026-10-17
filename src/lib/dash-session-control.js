/**
 * @fileoverview Session control for collaboration: presenter mode, hand-raise
 * queue, kick and session bans.
 *
 * Presenter mode ("Ведущий"): the project owner leads a lesson or stream.
 * Everyone else becomes an audience (read-only) and can raise their hand to
 * ask for speech. The presenter can grant speech to individual participants.
 *
 * Transport: best-effort presence channel (`control` field), so viewers can
 * participate too and nothing touches the persistent project document.
 * Kicks additionally revoke the collaborator grant on the server, which
 * forces the removed client's session to close (server-enforced).
 */

import {requestDashApi} from './dash-api.js';
import viewState from './dash-view-state.js';

const BANS_STORAGE_KEY = 'dash-session-bans';

const now = () => Date.now();

const loadBans = projectId => {
    try {
        const raw = localStorage.getItem(`${BANS_STORAGE_KEY}:${projectId}`);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        return {};
    }
};

const saveBans = (projectId, bans) => {
    try {
        localStorage.setItem(`${BANS_STORAGE_KEY}:${projectId}`, JSON.stringify(bans));
    } catch (error) {
        // Persistence is optional.
    }
};

class DashSessionControl {
    constructor () {
        this.vm = null;
        this.listeners = new Set();
        this.statusListener = null;
        this.presenceUnsubscribe = null;
        this.selfUserId = null;
        this.selfConnectionId = null;

        // Local intents (published through presence).
        this.presenting = false;
        this.handRaisedAt = 0;
        this.grantedUsers = new Map(); // userId -> timestamp (presenter grants)

        // Mirrored remote state.
        this.remotePresenterUserId = null;
        this.remoteHandRaises = new Map(); // userId -> timestamp
        this.bans = {}; // userId -> {username, ts}
        this.autoFollowedPresenter = null;

        this.projectId = null;
    }

    /* ------------------------------------------------------------------ */
    /* Wiring                                                              */
    /* ------------------------------------------------------------------ */

    /**
     * Attach to a VM collaboration session (re-attaches on restart).
     * @param {VirtualMachine} vm the VM owning the session
     * @param {?string} projectId project id for persistent ban storage
     * @returns {function} detach
     */
    attach (vm, projectId) {
        this.detach();
        this.vm = vm;
        this.projectId = projectId ? String(projectId) : null;
        if (this.projectId) this.bans = loadBans(this.projectId);
        const bind = () => {
            const presence = (vm.dashCollaboration && vm.dashCollaboration.presence) || null;
            if (this.presenceUnsubscribe) {
                this.presenceUnsubscribe();
                this.presenceUnsubscribe = null;
            }
            if (presence) {
                this.presenceUnsubscribe = presence.subscribe(() => this.onPresenceChange());
                this.pushControl(true);
            }
            this.onPresenceChange();
        };
        this.statusListener = bind;
        vm.on('DASH_COLLABORATION_STATUS', bind);
        bind();
        return () => this.detach();
    }

    detach () {
        if (this.vm && this.statusListener) {
            this.vm.removeListener('DASH_COLLABORATION_STATUS', this.statusListener);
        }
        if (this.presenceUnsubscribe) {
            this.presenceUnsubscribe();
            this.presenceUnsubscribe = null;
        }
        this.vm = null;
    }

    presence () {
        return (this.vm && this.vm.dashCollaboration && this.vm.dashCollaboration.presence) || null;
    }

    client () {
        // vm.dashCollaboration is the session wrapper; the transport with the
        // role lives on its .client property (fallback for plain transports).
        const session = (this.vm && this.vm.dashCollaboration) || null;
        if (!session) return null;
        return session.client || session;
    }

    /* ------------------------------------------------------------------ */
    /* Roles helpers                                                       */
    /* ------------------------------------------------------------------ */

    getRole () {
        const client = this.client();
        return client ? client.role : null;
    }

    isOwner () {
        return this.getRole() === 'owner';
    }

    canEdit () {
        const client = this.client();
        if (!client || client.role === 'viewer') return false;
        if (!this.isPresentationActive()) return true;
        return this.isPresenterSelf() || this.isSpeechGranted(this.selfUserId);
    }

    /* ------------------------------------------------------------------ */
    /* Presenter mode                                                      */
    /* ------------------------------------------------------------------ */

    isPresentationActive () {
        return Boolean(this.presenting || this.remotePresenterUserId);
    }

    isPresenterSelf () {
        return this.presenting || (this.isOwner() && this.isPresentationActive() &&
            !this.remotePresenterUserId);
    }

    getPresenterName () {
        const presence = this.presence();
        if (!this.isPresentationActive()) return null;
        if (this.presenting) return 'self';
        const members = presence ? presence.getMembers() : [];
        const member = members.find(entry => entry.userId === this.remotePresenterUserId);
        return member ? member.username : null;
    }

    /** Owner starts a presentation. */
    startPresentation () {
        if (!this.isOwner()) return;
        this.presenting = true;
        this.grantedUsers.clear();
        this.pushControl(true);
        this.autoFollowPresenter();
        this.notify();
    }

    /** Owner (or forced reset) stops the presentation. */
    stopPresentation () {
        this.presenting = false;
        this.grantedUsers.clear();
        this.pushControl(true);
        this.autoFollowPresenter();
        this.notify();
    }

    /* ------------------------------------------------------------------ */
    /* Hand-raise queue                                                    */
    /* ------------------------------------------------------------------ */

    isHandRaised (userId) {
        const id = userId || this.selfUserId;
        if (!id) return false;
        return id === this.selfUserId ? this.handRaisedAt > 0 : this.remoteHandRaises.has(id);
    }

    getHandRaiseList () {
        const presence = this.presence();
        const members = presence ? presence.getMembers() : [];
        const entries = [];
        for (const [userId, ts] of [...this.remoteHandRaises]) {
            const member = members.find(entry => entry.userId === userId);
            entries.push({userId, username: member ? member.username : userId, ts});
        }
        if (this.handRaisedAt > 0) {
            entries.push({userId: this.selfUserId, username: 'self', ts: this.handRaisedAt, self: true});
        }
        return entries.sort((a, b) => a.ts - b.ts);
    }

    requestSpeech () {
        if (!this.isPresentationActive() || this.isPresenterSelf()) return;
        this.handRaisedAt = this.handRaisedAt ? 0 : now();
        this.pushControl(true);
        this.notify();
    }

    grantSpeech (userId) {
        if (!this.isPresenterSelf()) return;
        this.grantedUsers.set(String(userId), now());
        this.pushControl(true);
        this.notify();
    }

    revokeSpeech (userId) {
        if (!this.isPresenterSelf()) return;
        this.grantedUsers.delete(String(userId));
        this.pushControl(true);
        this.notify();
    }

    isSpeechGranted (userId) {
        if (!userId) return false;
        return this.grantedUsers.has(String(userId));
    }

    /* ------------------------------------------------------------------ */
    /* Kick and session bans                                               */
    /* ------------------------------------------------------------------ */

    /**
     * Remove a collaborator from the project (server-enforced kick).
     * With `ban`, also remember the user so the owner's UI refuses re-adding
     * them, and broadcast the ban so clients show a proper message.
     * @param {string} userId collaborator user id
     * @param {{username: ?string, ban: boolean}} options kick options
     */
    async kickUser (userId, options = {}) {
        if (!this.isOwner() || !this.projectId) throw new Error('Only the project owner can remove collaborators');
        const id = String(userId);
        const response = await requestDashApi(
            `/projects/${this.projectId}/collaborators/${encodeURIComponent(id)}`,
            {method: 'DELETE', credentials: 'include'}
        );
        if (!response.ok) {
            let message = `Could not remove collaborator (${response.status})`;
            try {
                const data = await response.json();
                if (data && data.error) message = data.error;
            } catch (error) {
                // Keep the generic message.
            }
            throw new Error(message);
        }
        if (options.ban) {
            this.bans[id] = {username: options.username || id, ts: now()};
            if (this.projectId) saveBans(this.projectId, this.bans);
        }
        this.pushControl(true);
        this.notify();
        return true;
    }

    isBanned (userId) {
        return Boolean(this.bans[String(userId)]);
    }

    getBans () {
        return Object.entries(this.bans).map(([userId, entry]) => ({userId, ...entry}));
    }

    unban (userId) {
        delete this.bans[String(userId)];
        if (this.projectId) saveBans(this.projectId, this.bans);
        this.pushControl(true);
        this.notify();
    }

    /* ------------------------------------------------------------------ */
    /* Presence transport                                                  */
    /* ------------------------------------------------------------------ */

    pushControl (immediate = false) {
        const presence = this.presence();
        if (!presence) return;
        const control = {
            presenting: this.presenting,
            handRaise: this.handRaisedAt,
            granted: [...this.grantedUsers.keys()],
            bans: this.isOwner() ? Object.keys(this.bans) : undefined
        };
        if (immediate) presence.update({control});
        else presence.update({control});
    }

    onPresenceChange () {
        const presence = this.presence();
        if (!presence) return;
        const self = presence.selfUserId;
        if (self) this.selfUserId = String(self);
        // Merge peer control states.
        let presenter = null;
        const raises = new Map();
        for (const peer of presence.getPeers()) {
            const control = peer.state && peer.state.control;
            if (!control) continue;
            if (control.presenting) presenter = String(peer.userId);
            if (Number.isFinite(control.handRaise) && control.handRaise > 0) {
                raises.set(String(peer.userId), control.handRaise);
            }
        }
        this.remotePresenterUserId = presenter;
        this.remoteHandRaises = raises;
        this.autoFollowPresenter();
        this.notify();
    }

    /**
     * While someone presents, the audience automatically follows the
     * presenter's view (tab, sprite, zoom, scroll). Applied once per
     * presenter; dismissing the follow chip keeps it off until the
     * presenter changes.
     */
    autoFollowPresenter () {
        const presenter = this.presenting ? this.selfUserId : this.remotePresenterUserId;
        if (!presenter || presenter === this.selfUserId) {
            if (this.autoFollowedPresenter &&
                viewState.getFollowTarget() === this.autoFollowedPresenter) {
                viewState.setFollowTarget(null);
            }
            this.autoFollowedPresenter = null;
            return;
        }
        if (this.autoFollowedPresenter === presenter) return;
        // Only take over when the user is not following someone already.
        if (!viewState.getFollowTarget()) {
            viewState.setFollowTarget(presenter);
            this.autoFollowedPresenter = presenter;
        } else if (viewState.getFollowTarget() === this.autoFollowedPresenter) {
            viewState.setFollowTarget(presenter);
            this.autoFollowedPresenter = presenter;
        }
    }

    /* ------------------------------------------------------------------ */
    /* Subscriptions                                                       */
    /* ------------------------------------------------------------------ */

    subscribe (listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify () {
        for (const listener of [...this.listeners]) {
            try {
                listener();
            } catch (error) {
                // Listener errors must never break the channel.
            }
        }
    }

    /** UI snapshot. */
    getState () {
        return {
            role: this.getRole(),
            isOwner: this.isOwner(),
            presenting: this.presenting,
            presentationActive: this.isPresentationActive(),
            presenterName: this.getPresenterName(),
            handRaised: this.isHandRaised(),
            handRaiseList: this.getHandRaiseList(),
            canEdit: this.canEdit(),
            bans: this.getBans()
        };
    }
}

const sessionControl = new DashSessionControl();

export default sessionControl;
