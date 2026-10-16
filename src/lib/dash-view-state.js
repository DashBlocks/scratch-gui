/**
 * @fileoverview View-state sharing and follow mode for collaboration sessions.
 *
 * Every participant can publish what they are looking at (editor tab, sprite,
 * workspace zoom/scroll, stage mode) through the best-effort presence channel.
 * "Follow" applies a peer's view continuously, so classrooms and streams can
 * keep everyone on the same screen.
 *
 * The module never owns UI: GUI provides an adapter with getters/setters for
 * the parts of the editor it can drive (tab, sprite, workspace view, stage).
 */

const SEND_THROTTLE = 180;

const VIEW_FIELDS = ['tab', 'targetId', 'targetName', 'scale', 'scrollX', 'scrollY', 'stageMode'];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const sameView = (a, b) => {
    if (!a || !b) return false;
    return VIEW_FIELDS.every(field => a[field] === b[field]);
};

class DashViewState {
    constructor () {
        this.vm = null;
        this.adapter = null;
        this.local = {
            tab: null,
            targetId: null,
            targetName: null,
            scale: null,
            scrollX: null,
            scrollY: null,
            stageMode: null
        };
        this.followTargetKey = null; // presence peer key (connectionId/userId)
        this.listeners = new Set();
        this.presenceUnsubscribe = null;
        this.statusListener = null;
        this.sendTimer = null;
        this.applyingRemote = false;
    }

    /* ------------------------------------------------------------------ */
    /* Wiring                                                              */
    /* ------------------------------------------------------------------ */

    /**
     * Attach to a VM's collaboration session (re-attaches automatically
     * when the session restarts).
     * @param {VirtualMachine} vm the VM owning the session
     * @param {object} adapter {getTab, setTab, getWorkspace, setSprite, getStageMode, setStageMode}
     * @returns {function} detach
     */
    attach (vm, adapter) {
        this.detach();
        this.vm = vm;
        this.adapter = adapter;
        const bind = () => {
            const presence = (vm.dashCollaboration && vm.dashCollaboration.presence) || null;
            if (this.presenceUnsubscribe) {
                this.presenceUnsubscribe();
                this.presenceUnsubscribe = null;
            }
            if (presence) {
                this.presenceUnsubscribe = presence.subscribe(() => this.onPresenceChange());
                this.pushLocal(true);
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
        clearTimeout(this.sendTimer);
        this.vm = null;
        this.adapter = null;
        this.followTargetKey = null;
    }

    /* ------------------------------------------------------------------ */
    /* Local view publishing                                              */
    /* ------------------------------------------------------------------ */

    /**
     * Publish a patch of the local view. Throttled; ignored while following
     * someone else (their view is what matters then).
     * @param {object} patch partial view fields
     */
    update (patch) {
        if (this.applyingRemote) return;
        let changed = false;
        for (const field of VIEW_FIELDS) {
            if (!Object.prototype.hasOwnProperty.call(patch, field)) continue;
            if (this.local[field] !== patch[field]) {
                this.local[field] = patch[field];
                changed = true;
            }
        }
        if (changed) {
            this.notify();
            this.pushLocal();
        }
    }

    /** Publish the current view immediately from the adapter. */
    capture () {
        if (!this.adapter) return;
        const workspace = typeof this.adapter.getWorkspace === 'function' ? this.adapter.getWorkspace() : null;
        this.update({
            tab: this.adapter.getTab ? this.adapter.getTab() : null,
            targetId: this.adapter.getTargetId ? this.adapter.getTargetId() : null,
            targetName: this.adapter.getTargetName ? this.adapter.getTargetName() : null,
            scale: workspace ? Math.round((workspace.scale || 1) * 100) / 100 : null,
            scrollX: workspace ? Math.round(workspace.scrollX || 0) : null,
            scrollY: workspace ? Math.round(workspace.scrollY || 0) : null,
            stageMode: this.adapter.getStageMode ? this.adapter.getStageMode() : null
        });
    }

    pushLocal (immediate = false) {
        const presence = this.presence();
        if (!presence) return;
        if (this.followTargetKey) return; // do not echo a followed view
        const send = () => presence.update({view: {...this.local}});
        if (immediate) {
            clearTimeout(this.sendTimer);
            send();
            return;
        }
        if (this.sendTimer) return;
        this.sendTimer = setTimeout(() => {
            this.sendTimer = null;
            send();
        }, SEND_THROTTLE);
    }

    presence () {
        return (this.vm && this.vm.dashCollaboration && this.vm.dashCollaboration.presence) || null;
    }

    /* ------------------------------------------------------------------ */
    /* Follow mode                                                         */
    /* ------------------------------------------------------------------ */

    /**
     * Follow a peer (or stop with null). While following, the peer's view is
     * applied to the local editor on every presence update.
     * @param {?string} key presence peer key (connectionId or userId)
     */
    setFollowTarget (key) {
        if (this.followTargetKey === key) return;
        this.followTargetKey = key;
        if (!key) {
            // Resume publishing our own view.
            this.pushLocal(true);
        } else {
            this.onPresenceChange();
        }
        this.notify();
    }

    getFollowTarget () {
        return this.followTargetKey;
    }

    /** Human-readable name of the followed peer, if any. */
    getFollowName () {
        const peer = this.findPeer(this.followTargetKey);
        return peer ? peer.username : null;
    }

    findPeer (key) {
        const presence = this.presence();
        if (!presence || !key) return null;
        return presence.getPeers().find(peer =>
            `${peer.connectionId || ''}:${peer.userId || ''}` === key || peer.userId === key
        ) || null;
    }

    onPresenceChange () {
        if (!this.followTargetKey || !this.adapter) return;
        const peer = this.findPeer(this.followTargetKey);
        if (!peer) {
            // Peer vanished: stop following rather than freezing the view.
            this.setFollowTarget(null);
            return;
        }
        const view = peer.state && peer.state.view;
        if (!view) return;
        this.applyRemoteView(view);
        this.notify();
    }

    /**
     * Apply a remote view to the local editor, guarding against loops.
     * @param {object} view remote view fields
     */
    applyRemoteView (view) {
        if (!this.adapter || !view) return;
        this.applyingRemote = true;
        try {
            if (typeof view.tab === 'string' && this.adapter.setTab) {
                this.adapter.setTab(view.tab);
            }
            if (view.targetId && this.adapter.setSprite) {
                this.adapter.setSprite(view.targetId);
            }
            const workspace = this.adapter.getWorkspace ? this.adapter.getWorkspace() : null;
            if (workspace && Number.isFinite(view.scale)) {
                const scale = clamp(view.scale, 0.25, 4);
                if (Math.abs((workspace.scale || 1) - scale) > 0.01) workspace.scale = scale;
                if (Number.isFinite(view.scrollX)) workspace.scrollX = view.scrollX;
                if (Number.isFinite(view.scrollY)) workspace.scrollY = view.scrollY;
                if (typeof workspace.resize === 'function') workspace.resize();
            }
            if (typeof view.stageMode === 'string' && this.adapter.setStageMode) {
                this.adapter.setStageMode(view.stageMode);
            }
        } finally {
            this.applyingRemote = false;
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

    /** Snapshot for debugging/UI: local view + follow target. */
    getState () {
        return {
            local: {...this.local},
            followTargetKey: this.followTargetKey,
            followName: this.getFollowName()
        };
    }
}

const viewState = new DashViewState();

export default viewState;
export {sameView, VIEW_FIELDS};
