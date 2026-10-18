/**
 * Ephemeral presence state for Dash live-collaboration sessions.
 * Tracks where each participant's cursor is (stage / blocks workspace), which
 * sprite they have open, and which block they are dragging. State is relayed
 * over the collaboration WebSocket as best-effort "presence" messages (never
 * written to the persistent Yjs document), so viewers can share presence too.
 */

const PEER_TTL = 12000;
const SEND_INTERVAL = 80;
const NOTIFY_INTERVAL = 50;

/**
 * Stable per-user color so cursors and avatars keep the same color over time.
 * @param {string} idString user id, connection id or similar stable identifier
 * @returns {string} CSS color
 */
const presenceColor = idString => {
    let hash = 0;
    const value = String(idString);
    for (let i = 0; i < value.length; i++) {
        hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
    }
    return `hsl(${Math.abs(hash) % 360}, 72%, 50%)`;
};

const sameValue = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Subscribe a component to presence/session changes of a VM.
 * Re-attaches automatically when a collaboration session starts or ends.
 * @param {VirtualMachine} vm the VM owning the collaboration session
 * @param {function} onChange called when presence data may have changed
 * @returns {function} detach listener
 */
const listenPresence = (vm, onChange) => {
    let presence = null;
    let unsubscribe = null;
    const attach = () => {
        const next = (vm.dashCollaboration && vm.dashCollaboration.presence) || null;
        if (next === presence) return;
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        presence = next;
        if (presence) unsubscribe = presence.subscribe(onChange);
        onChange();
    };
    const onStatus = () => attach();
    vm.on('DASH_COLLABORATION_STATUS', onStatus);
    attach();
    return () => {
        vm.removeListener('DASH_COLLABORATION_STATUS', onStatus);
        if (unsubscribe) unsubscribe();
    };
};

class DashPresence {
    constructor () {
        this.peers = new Map();
        this.listeners = new Set();
        this.local = {
            cursor: null,
            targetId: null,
            dragging: null
        };
        this.members = [];
        this.selfId = null;
        this.selfUserId = null;
        this.send = null;
        this.sendTimer = null;
        this.notifyTimer = null;
        this.pruneTimer = setInterval(() => this.prune(), 3000);
    }
    /**
     * Wire this presence channel to a collaboration client.
     * @param {DashCollaboration} client active collaboration transport
     */
    bind (client) {
        this.send = state => client.sendPresence(state);
        client.onPresence = message => this.receive(message);
    }
    setSelf (connectionId, userId) {
        this.selfId = connectionId || userId || null;
        this.selfUserId = userId || null;
    }
    setMembers (members) {
        this.members = Array.isArray(members) ? members : [];
        let changed = false;
        for (const [key, peer] of [...this.peers]) {
            const alive = this.members.some(member => (member.connectionId || member.userId) === key);
            if (!alive) {
                this.peers.delete(key);
                changed = true;
            }
        }
        if (changed) this.scheduleNotify();
    }
    /**
     * Publish a patch of the local presence state.
     * @param {{cursor: ?object, targetId: ?string, dragging: ?string}} patch partial local state
     */
    update (patch) {
        let changed = false;
        for (const key of Object.keys(patch)) {
            if (!sameValue(this.local[key], patch[key])) {
                this.local[key] = patch[key];
                changed = true;
            }
        }
        if (!changed) return;
        this.scheduleSend();
        this.scheduleNotify();
    }
    scheduleSend () {
        if (this.sendTimer) return;
        this.sendTimer = setTimeout(() => {
            this.sendTimer = null;
            if (this.send) this.send({...this.local});
        }, SEND_INTERVAL);
    }
    receive (message) {
        if (!message || typeof message !== 'object') return;
        const key = message.connectionId || message.userId;
        if (typeof key !== 'string' || !key) return;
        if (key === this.selfId) return;
        if (!this.selfId && this.selfUserId && message.userId === this.selfUserId) return;
        const state = message.state && typeof message.state === 'object' && !Array.isArray(message.state) ?
            message.state : {};
        this.peers.set(key, {
            id: key,
            userId: typeof message.userId === 'string' ? message.userId : '',
            username: typeof message.username === 'string' && message.username ? message.username : '...',
            color: presenceColor(key),
            state,
            seen: Date.now()
        });
        this.scheduleNotify();
    }
    prune () {
        const now = Date.now();
        let changed = false;
        for (const [key, peer] of [...this.peers]) {
            if (now - peer.seen > PEER_TTL) {
                this.peers.delete(key);
                changed = true;
            }
        }
        if (changed) this.scheduleNotify();
    }
    getPeers () {
        return [...this.peers.values()];
    }
    getMembers () {
        return this.members;
    }
    subscribe (listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    scheduleNotify () {
        if (this.notifyTimer) return;
        this.notifyTimer = setTimeout(() => {
            this.notifyTimer = null;
            for (const listener of [...this.listeners]) listener();
        }, NOTIFY_INTERVAL);
    }
    reset () {
        this.peers.clear();
        this.local = {
            cursor: null,
            targetId: null,
            dragging: null
        };
        this.scheduleNotify();
    }
    destroy () {
        clearInterval(this.pruneTimer);
        clearTimeout(this.sendTimer);
        clearTimeout(this.notifyTimer);
        this.listeners.clear();
        this.peers.clear();
    }
}

export {DashPresence as default, presenceColor, listenPresence};
