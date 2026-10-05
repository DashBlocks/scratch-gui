import * as Y from 'yjs';
import JSZip from 'jszip';
import AddonHooks from '../addons/hooks';
import DashCollaboration from './dash-collaboration';

const maps = ['blocks', 'variables', 'lists', 'broadcasts', 'comments'];
const targetFields = [
    'name', 'x', 'y', 'size', 'direction', 'visible', 'draggable',
    'rotationStyle', 'currentCostume', 'layerOrder', 'tempo', 'volume',
    'videoTransparency', 'videoState', 'textToSpeechLanguage'
];
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = value => JSON.parse(JSON.stringify(value));
const merge = (before, after, current) => {
    if (equal(before, after)) return current;
    if (!before || !after || !current || Array.isArray(before) || Array.isArray(after) ||
        typeof before !== 'object' || typeof after !== 'object' || typeof current !== 'object') return clone(after);
    const result = {...current};
    for (const key of Object.keys(before)) {
        if (!Object.prototype.hasOwnProperty.call(after, key)) delete result[key];
    }
    for (const key of Object.keys(after)) {
        if (!equal(before[key], after[key])) result[key] = merge(before[key], after[key], current[key]);
    }
    return result;
};

export default class DashCollaborationSession {
    constructor (vm, projectId) {
        this.vm = vm;
        this.projectId = String(projectId);
        this.state = 'connecting';
        this.error = '';
        this.members = [];
        this.loaded = false;
        this.dirty = false;
        this.changed = false;
        this.applying = false;
        this.disposed = false;
        this.base = null;
        this.workspace = null;
        this.controller = new AbortController();
        this.onLocalChange = () => {
            if (this.applying || !this.loaded || this.disposed) return;
            this.dirty = true;
            this.scheduleReconcile();
        };
        this.onDocumentChange = (update, origin) => {
            if (origin !== this.client) return;
            this.changed = true;
            this.scheduleReconcile();
        };
        this.client = new DashCollaboration(projectId, {
            onStatus: status => {
                this.state = status.state;
                this.error = status.error;
                if (status.state === 'connected') {
                    if (this.resolveReady) this.resolveReady();
                    this.changed = true;
                    this.scheduleReconcile();
                } else if (status.state === 'error' && this.rejectReady) {
                    this.rejectReady(new Error(status.error));
                }
                this.notify();
            },
            onMembers: members => {
                this.members = members;
                this.notify();
            }
        });
        this.client.doc.on('update', this.onDocumentChange);
        this.beforeUnload = event => {
            if (this.dirty || this.client.pending || this.client.queued) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', this.beforeUnload);
    }
    notify () {
        this.vm.emit('DASH_COLLABORATION_STATUS');
    }
    async fetchProject () {
        const ready = new Promise((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
        const timeout = setTimeout(() => this.rejectReady(new Error('Collaboration connection timed out')), 30000);
        try {
            this.client.connect();
            await ready;
            const bytes = await this.client.getSourceArchive(this.controller.signal);
            if (this.disposed) throw new Error('Collaboration closed');
            this.zip = await JSZip.loadAsync(bytes);
            this.zip.file('project.json', JSON.stringify(this.client.getProjectJSON()));
            return await this.zip.generateAsync({type: 'uint8array', compression: 'STORE'});
        } finally {
            clearTimeout(timeout);
            this.resolveReady = null;
            this.rejectReady = null;
        }
    }
    async attach () {
        if (this.disposed) return;
        this.applying = true;
        try {
            await this.vm.applyCollaborationState(this.client.getProjectJSON(), this.zip);
            if (this.disposed) return;
            this.base = this.vm.getCollaborationState();
            this.loaded = true;
            this.vm.on('PROJECT_CHANGED', this.onLocalChange);
        } finally {
            this.applying = false;
            this.scheduleReconcile();
            this.notify();
        }
    }
    scheduleReconcile () {
        if (!this.loaded || this.disposed) return;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.reconcile().catch(error => this.fail(error)), 80);
    }
    isBusy () {
        const element = document.activeElement;
        const workspace = AddonHooks.blocklyWorkspace;
        return (workspace && workspace.isDragging()) ||
            (element && (['INPUT', 'TEXTAREA'].includes(element.tagName) || element.isContentEditable));
    }
    commit () {
        if (!this.dirty) return;
        if (this.client.state !== 'connected' || this.client.role === 'viewer') {
            throw new Error('Local edits cannot be sent. Reopen the collaboration.');
        }
        const current = this.vm.getCollaborationState();
        const oldTargets = new Map(this.base.targets.map(target => [target.collaborationId, target]));
        const newTargets = new Map(current.targets.map(target => [target.collaborationId, target]));
        const targets = this.client.doc.getMap('targets');
        const order = this.client.doc.getArray('targetOrder');
        const operations = [];
        for (const [id] of oldTargets) {
            if (!newTargets.has(id) && targets.has(id)) {
                operations.push(() => {
                    targets.delete(id);
                    const index = order.toArray().indexOf(id);
                    if (index !== -1) order.delete(index, 1);
                });
            }
        }
        for (const [id, record] of newTargets) {
            const before = oldTargets.get(id);
            if (!before) {
                const target = new Y.Map();
                for (const [key, value] of Object.entries(record)) {
                    if (maps.includes(key)) {
                        const map = new Y.Map();
                        for (const [entry, item] of Object.entries(value || {})) map.set(entry, clone(item));
                        target.set(key, map);
                    } else {
                        target.set(key, clone(value));
                    }
                }
                operations.push(() => {
                    targets.set(id, target);
                    order.push([id]);
                });
                continue;
            }
            const target = targets.get(id);
            if (!(target instanceof Y.Map)) {
                throw new Error('This sprite was removed by another participant.');
            }
            for (const key of maps) {
                const oldValues = before[key] || {};
                const values = clone(record[key] || {});
                if (key === 'variables' || key === 'lists') {
                    for (const entry of Object.keys(values)) {
                        if (oldValues[entry]) values[entry][1] = oldValues[entry][1];
                    }
                }
                for (const entry of new Set([...Object.keys(oldValues), ...Object.keys(values)])) {
                    if (equal(oldValues[entry], values[entry])) continue;
                    const map = target.get(key);
                    if (!(map instanceof Y.Map)) throw new Error('Invalid collaboration target map.');
                    if (Object.prototype.hasOwnProperty.call(values, entry)) {
                        if (Object.prototype.hasOwnProperty.call(oldValues, entry) && !map.has(entry)) {
                            throw new Error('This item was removed by another participant. Reopen the collaboration.');
                        }
                        const value = merge(oldValues[entry], values[entry], map.get(entry));
                        operations.push(() => map.set(entry, value));
                    } else {
                        operations.push(() => map.delete(entry));
                    }
                }
            }
            if (before.name !== record.name) {
                operations.push(() => target.set('name', record.name));
            }
            for (const key of targetFields) {
                if (key === 'name' || equal(before[key], record[key])) continue;
                operations.push(() => target.set(key, clone(record[key])));
            }
        }
        const wantedOrder = current.targets.map(target => target.collaborationId);
        if (JSON.stringify(order.toArray()) !== JSON.stringify(wantedOrder)) {
            operations.push(() => {
                if (order.length) order.delete(0, order.length);
                if (wantedOrder.length) order.insert(0, wantedOrder);
            });
        }
        if (operations.length) this.client.change(() => operations.forEach(operation => operation()));
        this.base = current;
        this.dirty = false;
    }
    async reconcile () {
        if (this.disposed || !this.loaded || this.applying || this.client.state !== 'connected') return;
        if (this.isBusy()) return this.scheduleReconcile();
        this.commit();
        if (!this.changed) return;
        this.changed = false;
        this.applying = true;
        this.notify();
        try {
            await this.vm.applyCollaborationState(this.client.getProjectJSON(), this.zip);
            this.base = this.vm.getCollaborationState();
        } finally {
            this.applying = false;
            this.notify();
            if (this.changed) this.scheduleReconcile();
        }
    }
    async duplicateSprite () {
        if (!this.canEdit()) return;
        this.commit();
        this.applying = true;
        this.notify();
        try {
            await this.vm.duplicateSprite(this.vm.editingTarget.id);
            this.dirty = true;
        } finally {
            this.applying = false;
            this.scheduleReconcile();
            this.notify();
        }
    }
    deleteSprite () {
        if (!this.canEdit()) return;
        this.vm.deleteSprite(this.vm.editingTarget.id);
        this.dirty = true;
        this.scheduleReconcile();
    }
    canEdit () {
        return this.loaded && !this.disposed && !this.applying && this.client.state === 'connected' &&
            this.client.role !== 'viewer';
    }
    fail (error) {
        this.client.fail(error.message || String(error));
    }
    destroy () {
        this.disposed = true;
        clearTimeout(this.timer);
        this.controller.abort();
        if (this.rejectReady) this.rejectReady(new Error('Collaboration closed'));
        this.vm.removeListener('PROJECT_CHANGED', this.onLocalChange);
        this.client.doc.off('update', this.onDocumentChange);
        this.client.destroy();
        window.removeEventListener('beforeunload', this.beforeUnload);
    }
}
