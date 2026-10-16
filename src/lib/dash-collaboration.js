import * as Y from 'yjs';
import {API_ORIGIN, requestDashApi} from './dash-api.js';

const projectTargetAssets = target => {
    const value = target.toJSON();
    for (const key of ['costumes', 'sounds']) {
        const entries = target.get(key);
        const order = target.get(`${key}Order`);
        if (!(entries instanceof Y.Map) || !Array.isArray(order) ||
            new Set(order).size !== order.length || order.length > 1000 || entries.size > 1000) {
            throw new Error('Invalid collaboration assets');
        }
        const ids = order.filter(id => entries.has(id));
        const seen = new Set(ids);
        ids.push(...[...entries.keys()].filter(id => !seen.has(id)).sort());
        value[key] = ids.map(id => {
            const asset = entries.get(id);
            if (!(asset instanceof Y.Map) || asset.get('collaborationId') !== id) {
                throw new Error('Invalid collaboration asset ID');
            }
            return {...asset.get('content'), name: asset.get('name'), collaborationId: id};
        });
        delete value[`${key}Order`];
    }
    const selected = value.costumes.findIndex(asset => asset.collaborationId === value.currentCostumeId);
    value.currentCostume = Math.max(0, selected);
    delete value.currentCostumeId;
    return value;
};

export default class DashCollaboration {
    constructor (projectId, {onStatus = () => {}, onMembers = () => {}, onPresence = () => {}} = {}) {
        if (!/^[1-9]\d{0,19}$/.test(String(projectId))) throw new Error('Invalid Dash project ID');
        this.projectId = String(projectId);
        this.doc = new Y.Doc();
        this.onStatus = onStatus;
        this.onMembers = onMembers;
        this.onPresence = onPresence;
        this.active = false;
        this.generation = 0;
        this.attempts = 0;
        this.sequence = 0;
        this.state = 'disconnected';
        this.role = null;
        this.epoch = null;
        this.grantId = null;
        this.userId = null;
        this.connectionId = null;
        this.pending = null;
        this.queued = null;
        this.handleUpdate = this.handleUpdate.bind(this);
        this.doc.on('update', this.handleUpdate);
    }
    setStatus (state, error = '') {
        this.state = state;
        this.onStatus({state, role: this.role, error});
    }
    connect () {
        if (this.active) return;
        this.active = true;
        this.attempts = 0;
        this.open();
    }
    async open () {
        if (!this.active) return;
        const generation = ++this.generation;
        this.setStatus('connecting');
        const controller = new AbortController();
        this.controller = controller;
        const timeout = setTimeout(() => controller.abort(), 12000);
        try {
            const response = await requestDashApi(`/projects/${this.projectId}/collaboration-token`, {
                method: 'POST',
                credentials: 'include',
                signal: controller.signal
            });
            if (!this.active || generation !== this.generation) return;
            if ([401, 403, 404].includes(response.status)) {
                this.fail('Collaboration access denied');
                return;
            }
            if (!response.ok) throw new Error(`Connection failed (${response.status})`);
            const data = await response.json();
            if (!this.active || generation !== this.generation) return;
            if (!data.ok || typeof data.token !== 'string') throw new Error('Invalid collaboration token response');
            const url = new URL(`/collaboration/${this.projectId}`, API_ORIGIN);
            url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
            const ws = new WebSocket(url.toString());
            this.socket = ws;
            this.handshake = setTimeout(() => {
                if (generation === this.generation) ws.close();
            }, 10000);
            ws.onopen = () => {
                if (!this.active || generation !== this.generation) return ws.close();
                ws.send(JSON.stringify({type: 'auth', token: data.token}));
            };
            ws.onmessage = event => {
                if (!this.active || generation !== this.generation) return;
                try {
                    this.receive(JSON.parse(event.data));
                } catch (error) {
                    this.fail(error.message);
                }
            };
            ws.onerror = () => {};
            ws.onclose = event => {
                if (!this.active || generation !== this.generation) return;
                clearTimeout(this.handshake);
                clearTimeout(this.ackTimeout);
                this.socket = null;
                this.onMembers([]);
                if ([4400, 4401, 4403, 4409, 1009].includes(event.code)) {
                    this.fail(event.reason || 'Collaboration connection rejected');
                } else {
                    this.retry(event.reason || 'Connection interrupted');
                }
            };
        } catch (error) {
            if (this.active && generation === this.generation) this.retry(error.message);
        } finally {
            clearTimeout(timeout);
        }
    }
    retry (error) {
        if (!this.active) return;
        if (++this.attempts > 8) return this.fail(error || 'Could not reconnect');
        this.setStatus('reconnecting', error);
        clearTimeout(this.retryTimeout);
        this.retryTimeout = setTimeout(
            () => this.open(),
            Math.min(30000, 1000 * (2 ** (this.attempts - 1))) + (Math.random() * 500)
        );
    }
    receive (message) {
        if (message.type === 'ready') {
            if (!['owner', 'editor', 'viewer'].includes(message.role) || typeof message.epoch !== 'string' ||
                typeof message.grantId !== 'string' || typeof message.userId !== 'string') {
                throw new Error('Invalid room response');
            }
            if ((this.epoch && this.epoch !== message.epoch) || (this.grantId && this.grantId !== message.grantId) ||
                (this.userId && this.userId !== message.userId)) {
                throw new Error('Room or permissions changed. Reopen the project before reconnecting.');
            }
            this.userId = message.userId;
            this.connectionId = typeof message.connectionId === 'string' ? message.connectionId : null;
            this.epoch = message.epoch;
            this.grantId = message.grantId;
            this.role = message.role;
            Y.applyUpdate(this.doc, this.decode(message.data), this);
            clearTimeout(this.handshake);
            if (!this.pending && !this.queued) this.attempts = 0;
            this.setStatus('connected');
            if (this.pending) this.sendPending();
            else this.flush();
        } else if (message.type === 'update') {
            Y.applyUpdate(this.doc, this.decode(message.data), this);
        } else if (message.type === 'ack') {
            if (this.pending && message.id === this.pending.id) {
                clearTimeout(this.ackTimeout);
                this.pending = null;
                this.attempts = 0;
                this.flush();
            }
        } else if (message.type === 'members') {
            this.onMembers(message.members);
        } else if (message.type === 'presence') {
            if (!message || typeof message.state !== 'object' || message.state === null ||
                Array.isArray(message.state) ||
                (typeof message.connectionId !== 'string' && typeof message.userId !== 'string')) {
                return;
            }
            this.onPresence(message);
        } else {
            throw new Error('Unknown collaboration message');
        }
    }
    decode (data) {
        if (typeof data !== 'string' || data.length > 8 * 1024 * 1024) throw new Error('Invalid collaboration data');
        const binary = atob(data);
        return Uint8Array.from(binary, character => character.charCodeAt(0));
    }
    encode (data) {
        let binary = '';
        for (let i = 0; i < data.length; i += 8192) {
            binary += String.fromCharCode(...data.subarray(i, i + 8192));
        }
        return btoa(binary);
    }
    /**
     * Broadcast ephemeral presence state (cursor, selection) to other
     * participants. Best-effort: never queued, never persisted, allowed for
     * viewers. Dropped silently when the connection is busy or closed.
     * @param {object} state small JSON-serializable presence payload
     */
    sendPresence (state) {
        if (!this.active || this.state !== 'connected' || !this.socket ||
            this.socket.readyState !== WebSocket.OPEN) return;
        if (this.socket.bufferedAmount > 64 * 1024) return;
        try {
            this.socket.send(JSON.stringify({type: 'presence', state}));
        } catch (error) {
            // Presence is optional; ignore transport errors.
        }
    }
    change (operation) {
        if (this.state !== 'connected' || this.role === 'viewer') throw new Error('Collaboration is not writable');
        this.doc.transact(() => operation(this.doc));
    }
    getProjectJSON () {
        const meta = this.doc.getMap('collaboration');
        if (meta.get('schemaVersion') !== 4 || meta.get('projectId') !== this.projectId) {
            throw new Error('Project document is not initialized');
        }
        const targets = this.doc.getMap('targets');
        const project = this.doc.getMap('project').toJSON();
        const membership = this.doc.getArray('targetOrder').toArray();
        const sequence = this.doc.getMap('targetSequence');
        const preferred = sequence.get('ids');
        if (!membership.length || membership.length > 1000 || membership.length !== targets.size ||
            new Set(membership).size !== membership.length || sequence.size !== 1 ||
            !Array.isArray(preferred) || preferred.length > 1000 ||
            new Set(preferred).size !== preferred.length || preferred.some(id =>
            typeof id !== 'string' || !/^[\x21-\x7e]{1,128}$/.test(id))) {
            throw new Error('Invalid collaboration target order');
        }
        const members = new Set(membership);
        const order = preferred.filter(id => members.has(id));
        const ordered = new Set(order);
        for (const id of membership) {
            if (!ordered.has(id)) {
                order.push(id);
                ordered.add(id);
            }
        }
        project.targets = order.map(id => {
            const target = targets.get(id);
            if (!(target instanceof Y.Map) || target.get('collaborationId') !== id) {
                throw new Error('Invalid collaboration target');
            }
            return projectTargetAssets(target);
        });
        project.extensions = [...this.doc.getMap('extensionIds').keys()];
        project.extensionURLs = this.doc.getMap('extensionURLs').toJSON();
        return JSON.parse(JSON.stringify(project));
    }
    async uploadAsset (name, bytes, signal) {
        if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('Collaboration asset exceeds 10 MiB');
        const response = await requestDashApi(
            `/projects/${this.projectId}/collaboration-assets/${encodeURIComponent(name)}`,
            {method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/octet-stream'},
                body: bytes,
                signal}
        );
        if (!response.ok) throw new Error(`Could not upload collaboration asset (${response.status})`);
    }
    async getAsset (name, signal) {
        const response = await requestDashApi(
            `/projects/${this.projectId}/collaboration-assets/${encodeURIComponent(name)}`,
            {credentials: 'include', signal}
        );
        if (!response.ok) throw new Error(`Could not download collaboration asset (${response.status})`);
        return new Uint8Array(await response.arrayBuffer());
    }
    async getSourceArchive (signal) {
        const response = await requestDashApi(`/projects/${this.projectId}/collaboration-source`, {
            credentials: 'include',
            signal
        });
        if (!response.ok) throw new Error(`Could not load collaboration source (${response.status})`);
        return response.arrayBuffer();
    }

    handleUpdate (update, origin) {
        if (origin === this) return;
        if (!this.active || this.state !== 'connected' || this.role === 'viewer') {
            this.fail('Local collaboration edits are unavailable');
            return;
        }
        this.queued = this.queued ? Y.mergeUpdates([this.queued, update]) : update;
        if (this.queued.length > 256 * 1024) {
            this.fail('Collaboration change is too large');
            return;
        }
        clearTimeout(this.flushTimeout);
        this.flushTimeout = setTimeout(() => this.flush(), 50);
    }
    flush () {
        if (this.state !== 'connected' || this.pending || !this.queued) return;
        if (this.role === 'viewer') return this.fail('Read-only collaboration');
        this.pending = {
            type: 'update',
            id: String(++this.sequence),
            epoch: this.epoch,
            data: this.encode(this.queued)
        };
        this.queued = null;
        this.sendPending();
    }
    sendPending () {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.pending) return;
        if (this.role === 'viewer') return this.fail('Read-only collaboration');
        if (this.socket.bufferedAmount > 512 * 1024) {
            this.socket.close();
            return;
        }
        this.socket.send(JSON.stringify(this.pending));
        clearTimeout(this.ackTimeout);
        this.ackTimeout = setTimeout(() => {
            if (this.socket) this.socket.close();
        }, 15000);
    }
    disconnect () {
        this.active = false;
        this.generation++;
        clearTimeout(this.retryTimeout);
        clearTimeout(this.handshake);
        clearTimeout(this.ackTimeout);
        clearTimeout(this.flushTimeout);
        if (this.controller) this.controller.abort();
        if (this.socket) this.socket.close();
        this.socket = null;
        this.onMembers([]);
        this.setStatus('disconnected');
    }
    fail (error) {
        this.disconnect();
        this.setStatus('error', error);
    }
    destroy () {
        this.disconnect();
        this.doc.off('update', this.handleUpdate);
        this.doc.destroy();
    }
}
