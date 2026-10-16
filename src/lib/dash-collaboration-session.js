import * as Y from 'yjs';
import JSZip from 'jszip';
import AddonHooks from '../addons/hooks';
import DashCollaboration from './dash-collaboration';
import DashPresence from './dash-presence';

const maps = ['blocks', 'variables', 'lists', 'broadcasts', 'comments'];
const blockStructureFields = ['opcode', 'next', 'parent', 'inputs', 'shadow', 'mutation'];
const targetFields = [
    'name', 'x', 'y', 'size', 'direction', 'visible', 'draggable',
    'rotationStyle', 'layerOrder', 'tempo', 'volume',
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
const createAssetMap = record => {
    const {collaborationId, name, ...content} = record;
    const asset = new Y.Map();
    asset.set('collaborationId', collaborationId);
    asset.set('name', name);
    asset.set('content', content);
    return asset;
};
const syncAssets = (target, before, after, operations) => {
    for (const key of ['costumes', 'sounds']) {
        const map = target.get(key);
        if (!(map instanceof Y.Map)) throw new Error('Asset data has not been migrated');
        const previous = new Map((before[key] || []).map(asset => [asset.collaborationId, asset]));
        const wanted = new Map(after[key].map(asset => [asset.collaborationId, asset]));
        for (const id of new Set([...previous.keys(), ...wanted.keys()])) {
            if (equal(previous.get(id), wanted.get(id))) continue;
            if (wanted.has(id)) {
                if (previous.has(id) && !map.has(id)) {
                    throw new Error(
                        'This asset was deleted by another participant. Save a local copy before reconnecting.'
                    );
                }
                const asset = map.get(id);
                const next = wanted.get(id);
                const old = previous.get(id);
                if (old) {
                    if (!(asset instanceof Y.Map)) throw new Error('Invalid asset map');
                    if (old.name !== next.name) operations.push(() => asset.set('name', next.name));
                    const oldContent = {...old};
                    const content = {...next};
                    for (const property of ['name', 'collaborationId']) {
                        delete oldContent[property];
                        delete content[property];
                    }
                    if (!equal(oldContent, content)) operations.push(() => asset.set('content', clone(content)));
                } else operations.push(() => map.set(id, createAssetMap(clone(next))));
            } else operations.push(() => map.delete(id));
        }
        const oldOrder = [...previous.keys()];
        const newOrder = [...wanted.keys()];
        if (!equal(oldOrder, newOrder)) operations.push(() => target.set(`${key}Order`, newOrder));
    }
    const previousCostume = before.costumes && before.costumes[before.currentCostume || 0];
    const costume = after.costumes[after.currentCostume || 0];
    if ((!previousCostume && costume) || (previousCostume && (!costume ||
        previousCostume.collaborationId !== costume.collaborationId))) {
        operations.push(() => target.set('currentCostumeId', costume ? costume.collaborationId : null));
    }
};
const createTargetAssets = (target, record) => {
    for (const key of ['costumes', 'sounds']) {
        const map = new Y.Map();
        for (const asset of record[key]) map.set(asset.collaborationId, createAssetMap(clone(asset)));
        target.set(key, map);
        target.set(`${key}Order`, record[key].map(asset => asset.collaborationId));
    }
    const costume = record.costumes[record.currentCostume || 0];
    target.set('currentCostumeId', costume ? costume.collaborationId : null);
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
        this.localRevision = 0;
        this.documentRevision = 0;
        this.localOperations = 0;
        this.processing = false;
        this.uploadedAssets = new Set();
        this.extensionReferences = new Map();
        this.extensionSources = new Map();
        this.presence = new DashPresence();
        this.installOperationTracking();
        this.onLocalChange = () => {
            if (this.applying || !this.loaded || this.disposed) return;
            this.localRevision++;
            this.dirty = true;
            this.scheduleReconcile();
        };
        this.onDocumentChange = () => {
            this.documentRevision++;
            this.changed = true;
            this.scheduleReconcile();
        };
        this.client = this.createClient();
        this.beforeUnload = event => {
            if (this.dirty || this.localOperations || this.processing || this.client.pending || this.client.queued) {
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
                    this.presence.setSelf(client.connectionId, client.userId);
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
                this.presence.setMembers(members);
                this.notify();
            }
        });
        client.doc.on('update', this.onDocumentChange);
        this.presence.bind(client);
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
            const project = await this.getRemoteProject();
            await this.fetchRemoteAssets(project);
            this.zip.file('project.json', JSON.stringify(project));
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
                const project = await this.getRemoteProject();
                await this.fetchRemoteAssets(project);
                await this.vm.applyCollaborationState(project, this.zip);
                if (this.disposed) return;
                this.base = this.getLocalProject();
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
            const project = await this.getRemoteProject(client);
            await this.fetchRemoteAssets(project);
            await this.vm.applyCollaborationState(project, this.zip);
            if (this.disposed || client !== this.client) return;
            this.base = this.getLocalProject();
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
        const current = this.getLocalProject();
        const oldTargets = new Map(this.base.targets.map(target => [target.collaborationId, target]));
        const newTargets = new Map(current.targets.map(target => [target.collaborationId, target]));
        const targets = this.client.doc.getMap('targets');
        const order = this.client.doc.getArray('targetOrder');
        const sequence = this.client.doc.getMap('targetSequence');
        const operations = [];
        const urls = this.client.doc.getMap('extensionURLs');
        const extensionIds = this.client.doc.getMap('extensionIds');
        const previousExtensions = new Set(this.base.extensions || []);
        const currentExtensions = new Set(current.extensions || []);
        const removedExtensions = new Set([...previousExtensions].filter(id => !currentExtensions.has(id)));
        for (const id of removedExtensions) {
            operations.push(() => {
                extensionIds.delete(id);
                urls.delete(id);
            });
        }
        if (removedExtensions.size) {
            const project = this.client.doc.getMap('project');
            const monitors = project.get('monitors');
            if (Array.isArray(monitors)) {
                const remaining = monitors.filter(monitor =>
                    !removedExtensions.has(monitor.opcode.split('_')[0]));
                if (remaining.length !== monitors.length) operations.push(() => project.set('monitors', remaining));
            }
        }
        for (const id of currentExtensions) {
            if (!previousExtensions.has(id) && !extensionIds.has(id)) {
                operations.push(() => extensionIds.set(id, true));
            }
        }
        for (const [id, url] of Object.entries(current.extensionURLs || {})) {
            if (!currentExtensions.has(id)) continue;
            if (previousExtensions.has(id) && !extensionIds.has(id)) continue;
            if (urls.has(id) && urls.get(id) !== url) throw new Error(`Extension URL conflict: ${id}`);
            if (!urls.has(id)) operations.push(() => urls.set(id, url));
        }
        for (const [targetId, record] of newTargets) {
            const before = oldTargets.get(targetId);
            for (const [blockId, block] of Object.entries(record.blocks || {})) {
                const id = block.opcode.split('_')[0];
                if (previousExtensions.has(id) && !extensionIds.has(id) &&
                    !equal(before && before.blocks[blockId], block)) {
                    throw new Error(`Extension "${id}" was removed by another participant. Save a local copy.`);
                }
            }
        }
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
                    if (['costumes', 'sounds', 'currentCostume'].includes(key)) continue;
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
                createTargetAssets(target, record);
                operations.push(() => {
                    targets.set(id, target);
                });
                continue;
            }
            const target = targets.get(id);
            if (!(target instanceof Y.Map)) {
                if (equal(before, record)) continue;
                throw new Error(
                    `The sprite "${before.name}" is missing from collaboration. Save a local copy before reconnecting.`
                );
            }
            syncAssets(target, before, record, operations);
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
    async extensionFilename (bytes) {
        if (!bytes.byteLength || bytes.byteLength > 2 * 1024 * 1024) {
            throw new Error('Custom extension must contain between 1 byte and 2 MiB of JavaScript.');
        }
        new TextDecoder('utf-8', {fatal: true}).decode(bytes);
        const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
        return `${Array.from(hash, value => value.toString(16).padStart(2, '0')).join('')}.js`;
    }
    cacheExtension (name, bytes, originalURL) {
        const reference = `dash-extension:${name}`;
        let binary = '';
        for (let i = 0; i < bytes.length; i += 8192) {
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        const url = `data:application/javascript;base64,${btoa(binary)}`;
        this.extensionSources.set(reference, url);
        this.extensionReferences.set(url, reference);
        if (originalURL) this.extensionReferences.set(originalURL, reference);
        return url;
    }
    async prepareLocalExtensions (urls) {
        const prepared = [];
        for (const url of new Set(urls)) {
            if (!url.startsWith('data:')) {
                if (url.length > 4096 || new URL(url).protocol !== 'https:') {
                    throw new Error('Use an HTTPS extension URL, JavaScript file, or JavaScript code.');
                }
                prepared.push(url);
                continue;
            }
            const existing = this.extensionReferences.get(url);
            if (existing) {
                prepared.push(this.extensionSources.get(existing));
                continue;
            }
            if (url.length > 8 * 1024 * 1024) throw new Error('Custom extension data URL is too large.');
            const response = await fetch(url, {signal: this.controller.signal});
            const bytes = new Uint8Array(await response.arrayBuffer());
            const name = await this.extensionFilename(bytes);
            if (!this.uploadedAssets.has(name)) {
                await this.client.uploadAsset(name, bytes, this.controller.signal);
                if (this.disposed) throw new Error('Collaboration closed');
                this.uploadedAssets.add(name);
            }
            prepared.push(this.cacheExtension(name, bytes, url));
        }
        return prepared;
    }
    getLocalProject () {
        const project = this.vm.getCollaborationState();
        for (const [id, url] of Object.entries(project.extensionURLs || {})) {
            if (!url.startsWith('data:')) continue;
            const reference = this.extensionReferences.get(url);
            if (!reference) throw new Error('Custom extension has not been uploaded yet.');
            project.extensionURLs[id] = reference;
        }
        return project;
    }
    async getRemoteProject (client = this.client) {
        const project = client.getProjectJSON();
        for (const [id, reference] of Object.entries(project.extensionURLs || {})) {
            if (!reference.startsWith('dash-extension:')) continue;
            if (!/^dash-extension:[a-f0-9]{64}\.js$/.test(reference)) {
                throw new Error('Invalid custom extension reference.');
            }
            if (!this.extensionSources.has(reference)) {
                const name = reference.slice('dash-extension:'.length);
                const bytes = await client.getAsset(name, this.controller.signal);
                if (this.disposed) throw new Error('Collaboration closed');
                if (await this.extensionFilename(bytes) !== name) throw new Error('Custom extension hash mismatch.');
                this.cacheExtension(name, bytes);
                this.uploadedAssets.add(name);
            }
            project.extensionURLs[id] = this.extensionSources.get(reference);
        }
        return project;
    }
    async uploadLocalAssets () {
        await this.prepareLocalExtensions(Object.values(this.vm.getCollaborationState().extensionURLs || {}));
        for (const file of this.vm.getCollaborationAssets()) {
            if (this.zip.file(file.fileName) || this.uploadedAssets.has(file.fileName)) continue;
            await this.client.uploadAsset(file.fileName, file.fileContent, this.controller.signal);
            if (this.disposed) return;
            this.uploadedAssets.add(file.fileName);
            this.zip.file(file.fileName, file.fileContent);
        }
    }
    async fetchRemoteAssets (project) {
        for (const target of project.targets) {
            for (const asset of [...target.costumes, ...target.sounds]) {
                const name = `${asset.assetId}.${asset.dataFormat}`;
                if (this.zip.file(name)) continue;
                const sourceName = Object.keys(this.zip.files).find(entry => entry.endsWith(`/${name}`));
                const bytes = sourceName ? await this.zip.file(sourceName).async('uint8array') :
                    await this.client.getAsset(name, this.controller.signal);
                if (this.disposed) return;
                this.zip.file(name, bytes);
            }
        }
    }
    async runLocalOperation (operation) {
        this.vm.assertCollaborationWritable();
        this.localOperations++;
        try {
            return await operation();
        } finally {
            this.localOperations--;
            this.onLocalChange();
        }
    }
    installOperationTracking () {
        this.operationMethods = new Map();
        const methods = ['addSprite', 'addCostume', 'duplicateCostume', 'duplicateSound',
            'renameCostume', 'deleteCostume', 'addSound', 'renameSound', 'updateSoundBuffer',
            'deleteSound', 'updateBitmap', 'updateSvg', 'addBackdrop', 'renameSprite',
            'deleteSprite', 'duplicateSprite', 'shareBlocksToTarget', 'shareCostumeToTarget',
            'shareSoundToTarget', 'reorderTarget', 'reorderCostume', 'reorderSound'];
        for (const name of methods) {
            const original = this.vm[name];
            if (typeof original !== 'function') continue;
            const wrapped = (...args) => {
                this.vm.assertCollaborationWritable();
                this.localOperations++;
                const finish = () => {
                    this.localOperations--;
                    this.onLocalChange();
                };
                let result;
                try {
                    result = original.apply(this.vm, args);
                } catch (error) {
                    finish();
                    throw error;
                }
                if (result && typeof result.then === 'function') return Promise.resolve(result).finally(finish);
                finish();
                return result;
            };
            this.operationMethods.set(name, {original, wrapped});
            this.vm[name] = wrapped;
        }
    }
    async reconcile () {
        if (this.disposed || !this.loaded || this.processing || this.applying ||
            this.client.state !== 'connected') return;
        if (this.isBusy() || this.localOperations) return this.scheduleReconcile();
        this.processing = true;
        let plan;
        let again = false;
        try {
            const localRevision = this.localRevision;
            if (this.dirty) await this.uploadLocalAssets();
            if (this.disposed) return;
            if (localRevision !== this.localRevision || this.localOperations || this.isBusy()) {
                again = true;
                return;
            }
            if (this.client.state !== 'connected') return;
            this.commit();
            if (!this.changed) return;
            const documentRevision = this.documentRevision;
            const project = await this.getRemoteProject();
            await this.fetchRemoteAssets(project);
            if (this.disposed) return;
            plan = await this.vm.prepareCollaborationState(project, this.zip);
            if (this.disposed) return;
            if (localRevision !== this.localRevision || documentRevision !== this.documentRevision ||
                this.localOperations || this.isBusy() || this.client.state !== 'connected') {
                again = true;
                return;
            }
            this.applying = true;
            this.vm.applyPreparedCollaborationState(plan);
            this.base = this.getLocalProject();
            this.changed = false;
        } finally {
            this.vm.disposeCollaborationPlan(plan);
            this.applying = false;
            this.processing = false;
            if (!this.disposed) this.notify();
            if (!this.disposed && (again || this.changed || this.dirty)) this.scheduleReconcile();
        }
    }
    async duplicateSprite () {
        if (!this.canEdit()) return;
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
        return this.dirty || Boolean(this.localOperations || this.processing ||
            this.client.pending || this.client.queued);
    }
    destroy () {
        this.disposed = true;
        for (const [name, {original, wrapped}] of this.operationMethods) {
            if (this.vm[name] === wrapped) this.vm[name] = original;
        }
        clearTimeout(this.timer);
        this.controller.abort();
        if (this.rejectReady) this.rejectReady(new Error('Collaboration closed'));
        if (this.projectListenerAttached) {
            this.vm.removeListener('PROJECT_CHANGED', this.onLocalChange);
            this.projectListenerAttached = false;
        }
        this.client.doc.off('update', this.onDocumentChange);
        this.client.destroy();
        this.presence.destroy();
        window.removeEventListener('beforeunload', this.beforeUnload);
    }
}
