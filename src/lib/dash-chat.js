/**
 * Session chat store for Dash live-collaboration.
 * Messages are relayed over the collaboration WebSocket (never written to the
 * persistent Yjs project document), so viewers can chat too. The server keeps
 * the room history and replays it when participants join.
 */

const MAX_MESSAGES = 200;
const MAX_TEXT = 500;

const listenDashChat = (vm, onChange) => {
    let chat = null;
    let unsubscribe = null;
    const attach = () => {
        const next = (vm.dashCollaboration && vm.dashCollaboration.chat) || null;
        if (next === chat) return;
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        chat = next;
        if (chat) unsubscribe = chat.subscribe(onChange);
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

class DashChat {
    constructor () {
        this.messages = [];
        this.listeners = new Set();
        this.unread = 0;
        this.lastMention = null;
        this.selfUserId = null;
        this.selfUsername = null;
        this.send = null;
        this.notifyTimer = null;
    }
    /**
     * Wire this chat to a collaboration client.
     * @param {DashCollaboration} client active collaboration transport
     */
    bind (client) {
        this.send = message => client.sendChat(message);
        client.onChat = message => this.receive(message);
        client.onChatHistory = messages => this.setHistory(messages);
    }
    setSelf (userId, username) {
        this.selfUserId = userId || null;
        this.selfUsername = username || null;
    }
    setHistory (messages) {
        const history = messages
            .filter(message => message && typeof message === 'object' &&
                typeof message.id === 'string' && typeof message.text === 'string' &&
                message.text.length <= MAX_TEXT && Number.isFinite(message.ts))
            .slice(-MAX_MESSAGES);
        this.messages = history;
        this.scheduleNotify();
    }
    receive (message) {
        if (!message || typeof message !== 'object') return;
        if (this.messages.some(existing => existing.id === message.id)) return;
        this.messages = [...this.messages, message].slice(-MAX_MESSAGES);
        const fromSelf = message.userId === this.selfUserId;
        if (!fromSelf && this.selfUsername &&
            typeof message.text === 'string' &&
            message.text.toLowerCase().includes(`@${this.selfUsername.toLowerCase()}`)) {
            this.unread++;
            this.lastMention = message;
        }
        this.scheduleNotify();
    }
    /**
     * Send a chat message from the local user.
     * @param {string} text message text (1-500 characters, may contain emoji)
     * @param {?object} pin optional pin context {type, targetId, blockId, name}
     * @returns {boolean} whether the message was handed to the transport
     */
    sendText (text, pin = null) {
        const value = typeof text === 'string' ? text : '';
        if (!value.trim().length || value.length > MAX_TEXT) return false;
        if (!this.send) return false;
        this.send({text: value, pin});
        return true;
    }
    markRead () {
        if (!this.unread && !this.lastMention) return;
        this.unread = 0;
        this.lastMention = null;
        this.scheduleNotify();
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
        }, 30);
    }
    destroy () {
        clearTimeout(this.notifyTimer);
        this.listeners.clear();
        this.messages = [];
    }
}

export {DashChat as default, listenDashChat, MAX_TEXT};
