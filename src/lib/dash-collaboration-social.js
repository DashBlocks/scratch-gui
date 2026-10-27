const MAX_TEXT = 500;
const MAX_MESSAGES = 200;
const CURSOR_EVENT = 'DASH_COLLABORATION_CURSORS';
const CHAT_EVENT = 'DASH_COLLABORATION_CHAT';

const validCursor = cursor => cursor === null || Boolean(cursor &&
    ['blocks', 'stage'].includes(cursor.surface) && Number.isFinite(cursor.x) && Number.isFinite(cursor.y) &&
    (cursor.surface === 'stage' ?
        cursor.x >= 0 && cursor.x <= 1 && cursor.y >= 0 && cursor.y <= 1 :
        typeof cursor.targetId === 'string' && cursor.targetId.length > 0 && cursor.targetId.length <= 128 &&
        Math.abs(cursor.x) <= 10000000 && Math.abs(cursor.y) <= 10000000));

const validMessage = message => Boolean(message && typeof message.id === 'string' &&
    message.id.length <= 64 && typeof message.userId === 'string' && message.userId.length <= 64 &&
    typeof message.username === 'string' && message.username.length <= 128 &&
    typeof message.text === 'string' && message.text.trim() && message.text.length <= MAX_TEXT &&
    Number.isFinite(message.ts) && message.ts >= 0 && message.ts <= 8640000000000000);

const cursorColor = userId => {
    let hash = 0;
    for (const char of userId) hash = ((hash * 31) + char.charCodeAt(0)) >>> 0;
    return `hsl(${hash % 360}, 65%, 35%)`;
};

class CollaborationSocial {
    constructor (vm) {
        this.vm = vm;
        this.client = null;
        this.members = [];
        this.cursors = new Map();
        this.messages = [];
        this.unread = 0;
        this.reading = false;
        this.localCursor = null;
        this.lastSent = '';
        this.lastSentAt = 0;
        this.timer = setInterval(() => this.tick(), 100);
    }
    bind (client) {
        this.client = client;
        this.resetCursors();
    }
    resetCursors () {
        this.localCursor = null;
        this.lastSent = '';
        this.cursors.clear();
        this.vm.emit(CURSOR_EVENT);
    }
    setMembers (members) {
        this.members = members;
        const ids = new Set(members.map(member => member.connectionId));
        for (const id of this.cursors.keys()) {
            if (!ids.has(id)) this.cursors.delete(id);
        }
        this.vm.emit(CURSOR_EVENT);
    }
    receiveCursor (message) {
        if (!this.client || message.connectionId === this.client.connectionId) return;
        const member = this.members.find(item => item.connectionId === message.connectionId);
        if (!member || !message.state || !validCursor(message.state.cursor)) return;
        const cursor = message.state.cursor;
        if (cursor === null) this.cursors.delete(member.connectionId);
        else {
            this.cursors.set(member.connectionId, {
                id: member.connectionId,
                username: member.username,
                color: cursorColor(member.userId),
                cursor,
                seen: Date.now()
            });
        }
        this.vm.emit(CURSOR_EVENT);
    }
    updateCursor (cursor) {
        if (validCursor(cursor)) this.localCursor = cursor;
    }
    tick () {
        if (!this.client || this.client.state !== 'connected') return;
        const now = Date.now();
        const value = JSON.stringify(this.localCursor);
        if (value !== this.lastSent || (this.localCursor && now - this.lastSentAt >= 3000)) {
            if (this.client.sendPresence({cursor: this.localCursor})) {
                this.lastSent = value;
                this.lastSentAt = now;
            }
        }
        let changed = false;
        for (const [id, peer] of this.cursors) {
            if (now - peer.seen > 12000) {
                this.cursors.delete(id);
                changed = true;
            }
        }
        if (changed) this.vm.emit(CURSOR_EVENT);
    }
    setHistory (messages) {
        if (!Array.isArray(messages)) return;
        const unique = new Map();
        for (const message of messages.slice(-MAX_MESSAGES)) {
            if (validMessage(message)) unique.set(message.id, message);
        }
        this.messages = [...unique.values()];
        this.unread = 0;
        this.vm.emit(CHAT_EVENT);
    }
    receiveMessage (message) {
        if (!validMessage(message) || this.messages.some(item => item.id === message.id)) return;
        this.messages = [...this.messages, message].slice(-MAX_MESSAGES);
        if (!this.reading && this.client && message.userId !== this.client.userId) {
            this.unread = Math.min(MAX_MESSAGES, this.unread + 1);
        }
        this.vm.emit(CHAT_EVENT);
    }
    setReading (reading) {
        this.reading = reading;
        if (reading && this.unread) {
            this.unread = 0;
            this.vm.emit(CHAT_EVENT);
        }
    }
    sendMessage (text) {
        if (typeof text !== 'string' || !text.trim() || text.length > MAX_TEXT || !this.client) return false;
        return this.client.sendChat(text.trim());
    }
    destroy () {
        clearInterval(this.timer);
        this.client = null;
        this.cursors.clear();
        this.messages = [];
    }
}

export {CollaborationSocial as default, CURSOR_EVENT, CHAT_EVENT, MAX_TEXT, validCursor};
