// eslint-disable-next-line import/no-unresolved
import * as Y from 'yjs';
import JSZip from 'jszip';
import AddonHooks from '../addons/hooks';
import DashCollaboration from './dash-collaboration';

const maps = ['blocks', 'variables', 'lists', 'broadcasts', 'comments'];
const blockStructureFields = ['opcode', 'next', 'parent', 'inputs', 'shadow', 'mutation'];
const targetFields = [
    'name', 'x', 'y', 'size', 'direction', 'visible', 'draggable',
    'rotationStyle', 'currentCostume', 'layerOrder', 'tempo', 'volume',
    'videoTransparency', 'videoState', 'textToSpeechLanguage'
];
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = value => JSON.parse(JSON.stringify(value));
const createBlockMap = record => {
    const block = new Y.Map();
    for (const [key, value] of Object.entries(record || {})) {
        if (key === 'fields' || key === 'inputs') {
            const entries = new Y.Map();
            for (const [entry, entryValue] of Object.entries(value || {})) {
                entries.set(entry, clone(entryValue));
            }
            block.set(key, entries);
        } else {
            block.set(key, clone(value));
        }
    }
    return block;
};
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
const syncBlockMap = (map, before, after, operations) => {
    for (const id of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const previous = before[id];
        const next = after[id];
        if (equal(previous, next)) continue;
        if (typeof next === 'undefined') {
            operations.push(() => map.delete(id));
            continue;
        }
        const existing = map.get(id);
        const hasExistingBlockMap = existing instanceof Y.Map;
        if (typeof previous === 'undefined') {
            operations.push(() => map.set(id, createBlockMap(next)));
            continue;
        }
        if (hasExistingBlockMap === false) {
            throw new Error('Block data has not been migrated. Reopen the collaboration.');
        }

        for (const key of blockStructureFields) {
            if (equal(previous[key], next[key])) continue;
            if (key === 'inputs' && previous[key] && next[key] &&
                typeof previous[key] === 'object' && typeof next[key] === 'object' &&
                !Array.isArray(previous[key]) && !Array.isArray(next[key])) {
                const inputs = existing.get(key);
                if (!(inputs instanceof Y.Map)) {
                    throw new Error('Block inputs have not been migrated. Reopen the collaboration.');
                }
                for (const input of new Set([
                    ...Object.keys(previous[key]),
                    ...Object.keys(next[key])
                ])) {
                    if (equal(previous[key][input], next[key][input])) continue;
                    if (Object.prototype.hasOwnProperty.call(next[key], input)) {
                        operations.push(() => inputs.set(input, clone(next[key][input])));
                    } else {
                        operations.push(() => inputs.delete(input));
                    }
                }
                continue;
            }
            if (Object.prototype.hasOwnProperty.call(next, key)) {
                operations.push(() => existing.set(key, clone(next[key])));
            } else {
                operations.push(() => existing.delete(key));
            }
        }

        const oldFields = previous.fields || {};
        const newFields = next.fields || {};
        if (!equal(oldFields, newFields)) {
            const currentFields = existing.get('fields');
            const hasExistingFields = currentFields instanceof Y.Map;
            if (hasExistingFields === false) {
                const fields = new Y.Map();
                for (const [field, value] of Object.entries(newFields)) fields.set(field, clone(value));
                operations.push(() => existing.set('fields', fields));
            } else {
                for (const field of new Set([...Object.keys(oldFields), ...Object.keys(newFields)])) {
                    if (equal(oldFields[field], newFields[field])) continue;
                    if (Object.prototype.hasOwnProperty.call(newFields, field)) {
                        operations.push(() => currentFields.set(field, clone(newFields[field])));
                    } else {
                        operations.push(() => currentFields.delete(field));
                    }
                }
            }
        }

        const keys = new Set([
            ...Object.keys(previous).filter(key => key !== 'fields' && !blockStructureFields.includes(key)),
            ...Object.keys(next).filter(key => key !== 'fields' && !blockStructureFields.includes(key))
        ]);
        for (const key of keys) {
            if (equal(previous[key], next[key])) continue;
            if (Object.prototype.hasOwnProperty.call(next, key)) {
                operations.push(() => existing.set(key, clone(next[key])));
            } else {
                operations.push(() => existing.delete(key));
            }
        }
    }
};
const reconcileTargetOrder = (order, targets, previousOrder, wantedOrder, sequence) => {
    const seen = new Set();
    for (let index = order.length - 1; index >= 0; index--) {
        const id = order.get(index);
        if (!targets.has(id) || seen.has(id)) {
            order.delete(index, 1);
        } else {
            seen.add(id);
        }
    }
    const wanted = wantedOrder.filter((id, index) =>
        targets.has(id) && wantedOrder.indexOf(id) === index);
    for (const id of wanted) {
        if (!seen.has(id)) {
            order.push([id]);
            seen.add(id);
        }
    }
    if (!equal(previousOrder, wantedOrder)) sequence.set('ids', wanted);
};
export {reconcileTargetOrder, syncBlockMap};

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
        this.localOperation = false;
        this.restoreOnReconnect = false;
        this.projectListenerAttached = false;
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
        this.client = this.createClient();
        this.beforeUnload = event => {
            if (this.dirty || this.client.pending || this.client.queued) {
                event.preventDefault();
                event.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', this.beforeUnload);
    }
    createClient () {
        const client = new DashCollaboration(this.projectId, {
            onStatus: status => {
                this.state = status.state;
                this.error = status.error;
                if (status.state === 'connected') {
                    if (this.resolveReady) this.resolveReady();
                    if (this.restoreOnReconnect) {
                        this.restoreAfterReconnect().catch(error => this.fail(error));
                    } else {
                        this.changed = true;
                        this.scheduleReconcile();
                    }
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
        client.doc.on('update', this.onDocumentChange);
        return client;
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
    attach () {
        if (this.disposed || this.projectListenerAttached) return Promise.resolve();
        if (this.attachPromise) return this.attachPromise;
        this.attachPromise = (async () => {
            this.applying = true;
            try {
                await this.vm.applyCollaborationState(this.client.getProjectJSON(), this.zip);
                if (this.disposed) return;
                this.base = this.vm.getCollaborationState();
                this.loaded = true;
                this.vm.on('PROJECT_CHANGED', this.onLocalChange);
                this.projectListenerAttached = true;
            } finally {
                this.applying = false;
                this.attachPromise = null;
                this.scheduleReconcile();
                this.notify();
            }
        })();
        return this.attachPromise;
    }
    async restoreAfterReconnect () {
        if (this.disposed || !this.restoreOnReconnect || this.applying) return;
        const client = this.client;
        this.applying = true;
        this.changed = false;
        this.notify();
        try {
            await this.vm.applyCollaborationState(client.getProjectJSON(), this.zip);
            if (this.disposed || client !== this.client) return;
            this.base = this.vm.getCollaborationState();
            this.loaded = true;
            this.restoreOnReconnect = false;
        } finally {
            this.applying = false;
            this.notify();
            if (this.changed) this.scheduleReconcile();
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
        if (!this.base) throw new Error('Collaboration state is not ready. Reopen the collaboration.');
        if (this.client.state !== 'connected' || this.client.role === 'viewer') {
            throw new Error('Local edits cannot be sent. Reopen the collaboration.');
        }
        const current = this.vm.getCollaborationState();
        const oldTargets = new Map(this.base.targets.map(target => [target.collaborationId, target]));
        const newTargets = new Map(current.targets.map(target => [target.collaborationId, target]));
        const targets = this.client.doc.getMap('targets');
        const order = this.client.doc.getArray('targetOrder');
        const sequence = this.client.doc.getMap('targetSequence');
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
                        for (const [entry, item] of Object.entries(value || {})) {
                            map.set(entry, key === 'blocks' ? createBlockMap(item) : clone(item));
                        }
                        target.set(key, map);
                    } else {
                        target.set(key, clone(value));
                    }
                }
                operations.push(() => {
                    targets.set(id, target);
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
                const map = target.get(key);
                if (!(map instanceof Y.Map)) throw new Error('Invalid collaboration target map.');
                if (key === 'blocks') {
                    syncBlockMap(map, oldValues, values, operations);
                    continue;
                }
                if (key === 'variables' || key === 'lists') {
                    for (const entry of Object.keys(values)) {
                        if (oldValues[entry]) values[entry][1] = oldValues[entry][1];
                    }
                }
                for (const entry of new Set([...Object.keys(oldValues), ...Object.keys(values)])) {
                    if (equal(oldValues[entry], values[entry])) continue;
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
        const previousOrder = this.base.targets.map(target => target.collaborationId);
        const wantedOrder = current.targets.map(target => target.collaborationId);
        operations.push(() => reconcileTargetOrder(order, targets, previousOrder, wantedOrder, sequence));
        if (operations.length) this.client.change(() => operations.forEach(operation => operation()));
        this.base = current;
        this.dirty = false;
    }
    async reconcile () {
        if (this.disposed || !this.loaded || this.applying || this.localOperation ||
            this.client.state !== 'connected') return;
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
        this.localOperation = true;
        this.notify();
        try {
            await this.vm.duplicateSprite(this.vm.editingTarget.id);
            this.dirty = true;
        } finally {
            this.localOperation = false;
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
        return this.loaded && Boolean(this.base) && !this.restoreOnReconnect && !this.disposed &&
            !this.applying && this.client.state === 'connected' &&
            this.client.role !== 'viewer';
    }
    fail (error) {
        this.client.fail(error.message || String(error));
    }
    reconnect (discardUnsavedChanges = false) {
        if (this.disposed) return;
        if (this.state !== 'error') return;
        if (this.hasUnsavedChanges() && !discardUnsavedChanges) return;
        this.client.destroy();
        this.client = this.createClient();
        this.dirty = false;
        this.changed = false;
        this.base = null;
        this.loaded = false;
        this.restoreOnReconnect = true;
        this.client.connect();
    }
    hasUnsavedChanges () {
        return this.dirty || Boolean(this.client.pending || this.client.queued);
    }
    destroy () {
        this.disposed = true;
        clearTimeout(this.timer);
        this.controller.abort();
        if (this.rejectReady) this.rejectReady(new Error('Collaboration closed'));
        if (this.projectListenerAttached) {
            this.vm.removeListener('PROJECT_CHANGED', this.onLocalChange);
            this.projectListenerAttached = false;
        }
        this.client.doc.off('update', this.onDocumentChange);
        this.client.destroy();
        window.removeEventListener('beforeunload', this.beforeUnload);
    }
}
