/**
 * @fileoverview Session activity feed with per-user undo and restore.
 *
 * Records what happened in a collaboration session:
 * - Local edits (sprite/costume/sound operations), with undo data captured
 *   from the VM (delete operations return restore functions; renames store
 *   the previous name)
 * - Remote edits, relayed as best-effort presence action events
 * - Session events (join/leave, presentation, speech grants, kicks)
 *
 * Undo is strictly per-user: each participant can only undo their own
 * operations, because shared undo in a live collaboration would destroy
 * other people's work.
 */

const MAX_ENTRIES = 200;
const MAX_UNDO = 50;

const OP_KINDS = {
    addSprite: {icon: 'sprite', verb: 'addedSprite'},
    deleteSprite: {icon: 'sprite', verb: 'deletedSprite', undoable: true},
    renameSprite: {icon: 'sprite', verb: 'renamedSprite', undoable: true},
    duplicateSprite: {icon: 'sprite', verb: 'duplicatedSprite'},
    addCostume: {icon: 'costume', verb: 'addedCostume', undoable: true},
    deleteCostume: {icon: 'costume', verb: 'deletedCostume', undoable: true},
    renameCostume: {icon: 'costume', verb: 'renamedCostume', undoable: true},
    duplicateCostume: {icon: 'costume', verb: 'duplicatedCostume'},
    updateBitmap: {icon: 'costume', verb: 'editedCostume'},
    updateSvg: {icon: 'costume', verb: 'editedCostume'},
    addBackdrop: {icon: 'costume', verb: 'addedBackdrop'},
    addSound: {icon: 'sound', verb: 'addedSound', undoable: true},
    deleteSound: {icon: 'sound', verb: 'deletedSound', undoable: true},
    renameSound: {icon: 'sound', verb: 'renamedSound', undoable: true},
    duplicateSound: {icon: 'sound', verb: 'duplicatedSound'},
    updateSoundBuffer: {icon: 'sound', verb: 'editedSound'},
    shareBlocksToTarget: {icon: 'sprite', verb: 'sharedBlocks'},
    shareCostumeToTarget: {icon: 'costume', verb: 'sharedCostume'},
    shareSoundToTarget: {icon: 'sound', verb: 'sharedSound'},
    reorderTarget: {icon: 'sprite', verb: 'reorderedSprites'},
    reorderCostume: {icon: 'costume', verb: 'reorderedCostumes'},
    reorderSound: {icon: 'sound', verb: 'reorderedSounds'}
};

let sequence = 0;
const nextId = () => `a${++sequence}-${Date.now().toString(36)}`;

const targetNameById = (vm, id) => {
    try {
        const target = vm && vm.runtime && vm.runtime.getTargetById && vm.runtime.getTargetById(id);
        return target && target.sprite ? target.sprite.name : null;
    } catch (error) {
        return null;
    }
};

const editingTargetName = vm => {
    try {
        return vm && vm.editingTarget && vm.editingTarget.sprite ? vm.editingTarget.sprite.name : null;
    } catch (error) {
        return null;
    }
};

class DashActivity {
    constructor () {
        this.entries = [];
        this.undoStack = []; // newest first; entries with inverse()
        this.listeners = new Set();
        this.vm = null;
        this.statusListener = null;
        this.eventUnsubscribe = null;
        this.membersUnsubscribe = null;
        this.knownMembers = new Set();
    }

    /* ------------------------------------------------------------------ */
    /* Wiring                                                              */
    /* ------------------------------------------------------------------ */

    /**
     * Attach to a VM collaboration session (re-attaches on restart).
     * @param {VirtualMachine} vm the VM owning the session
     * @returns {function} detach
     */
    attach (vm) {
        this.detach();
        this.vm = vm;
        const bind = () => {
            const collaboration = vm.dashCollaboration || null;
            const presence = collaboration && collaboration.presence;
            if (this.eventUnsubscribe) {
                this.eventUnsubscribe();
                this.eventUnsubscribe = null;
            }
            if (presence) {
                this.eventUnsubscribe = presence.onEvent(({peer, action}) => {
                    this.recordRemote(peer, action);
                });
            }
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
        if (this.eventUnsubscribe) {
            this.eventUnsubscribe();
            this.eventUnsubscribe = null;
        }
        this.vm = null;
    }

    /* ------------------------------------------------------------------ */
    /* Recording                                                           */
    /* ------------------------------------------------------------------ */

    /**
     * Called by the collaboration session wrapper before a local VM
     * operation runs. Captures context for the feed and for undo.
     * @param {string} name VM method name
     * @param {Array} args method arguments
     * @param {VirtualMachine} vm the VM
     * @returns {?object} handle for endLocalOperation
     */
    beginLocalOperation (name, args, vm) {
        const kind = OP_KINDS[name];
        if (!kind) return null;
        const handle = {name, kind, args, vm, before: null, targetName: null, diff: null, restore: null};
        try {
            switch (name) {
            case 'deleteSprite': {
                handle.targetName = targetNameById(vm, args[0]) || editingTargetName(vm);
                const sprite = this.targetSummary(vm, args[0]);
                handle.diff = {before: handle.targetName, after: null, summary: sprite};
                break;
            }
            case 'renameSprite':
                handle.targetName = targetNameById(vm, args[0]);
                handle.before = {previousName: handle.targetName, id: args[0]};
                handle.diff = {before: handle.targetName, after: String(args[1])};
                break;
            case 'renameCostume':
                handle.targetName = editingTargetName(vm);
                handle.before = {previousName: this.currentCostumeName(vm, args[0]), index: args[0]};
                handle.diff = {before: handle.before.previousName, after: String(args[1])};
                break;
            case 'renameSound':
                handle.targetName = editingTargetName(vm);
                handle.before = {previousName: this.currentSoundName(vm, args[0]), index: args[0]};
                handle.diff = {before: handle.before.previousName, after: String(args[1])};
                break;
            case 'deleteCostume':
                handle.targetName = editingTargetName(vm);
                handle.before = {name: this.currentCostumeName(vm, args[0]), index: args[0]};
                handle.diff = {before: handle.before.name, after: null};
                break;
            case 'deleteSound':
                handle.targetName = editingTargetName(vm);
                handle.before = {name: this.currentSoundName(vm, args[0]), index: args[0]};
                handle.diff = {before: handle.before.name, after: null};
                break;
            case 'addSprite':
                handle.targetName = this.spriteNameFromArg(args[0]);
                handle.diff = {before: null, after: handle.targetName};
                break;
            case 'addCostume':
                handle.targetName = editingTargetName(vm);
                handle.before = {name: args[0] && args[0].name};
                handle.diff = {before: null, after: handle.before.name || null};
                break;
            case 'addSound':
                handle.targetName = editingTargetName(vm);
                handle.before = {name: args[0] && args[0].name};
                handle.diff = {before: null, after: handle.before.name || null};
                break;
            default:
                handle.targetName = editingTargetName(vm);
            }
        } catch (error) {
            // Feed context is best-effort.
        }
        return handle;
    }

    /**
     * Called after the local operation finished. Records the entry and,
     * when possible, stores an inverse for personal undo. Also broadcasts
     * a remote-visible action event.
     * @param {?object} handle from beginLocalOperation
     * @param {*} result return value of the VM method (may hold a restore fn)
     */
    endLocalOperation (handle, result) {
        if (!handle) return;
        const {name, kind, before, targetName} = handle;
        let inverse = null;
        const vm = handle.vm;

        const resolveRestore = value => {
            if (typeof value === 'function') return value;
            if (value && typeof value.then === 'function') {
                // deleteSprite returns a promise of a restore function.
                return () => Promise.resolve(value).then(restore => {
                    if (typeof restore === 'function') return restore();
                    return undefined;
                });
            }
            return null;
        };

        switch (name) {
        case 'deleteSprite':
        case 'deleteCostume':
        case 'deleteSound':
            inverse = resolveRestore(result);
            break;
        case 'renameSprite':
            if (before && before.previousName && before.previousName !== targetName) {
                const id = before.id;
                const previous = before.previousName;
                inverse = () => vm.renameSprite(id, previous);
            }
            break;
        case 'renameCostume':
            if (before && before.previousName) {
                const index = before.index;
                const previous = before.previousName;
                inverse = () => vm.renameCostume(index, previous);
            }
            break;
        case 'renameSound':
            if (before && before.previousName) {
                const index = before.index;
                const previous = before.previousName;
                inverse = () => vm.renameSound(index, previous);
            }
            break;
        case 'addCostume':
        case 'addSound':
            // The added asset lands at the end of the list of the editing
            // target: undo removes it again.
            {
                const targetId = vm && vm.editingTarget && vm.editingTarget.id;
                if (targetId && name === 'addSound') {
                    inverse = () => {
                        const target = vm.runtime.getTargetById(targetId);
                        const count = target && target.getSounds ? target.getSounds().length : 0;
                        if (count > 0) return vm.deleteSound(count - 1);
                        return undefined;
                    };
                } else if (targetId && name === 'addCostume') {
                    inverse = () => {
                        const target = vm.runtime.getTargetById(targetId);
                        const count = target && target.getCostumes ? target.getCostumes().length : 0;
                        if (count > 1) return vm.deleteCostume(count - 1);
                        return undefined;
                    };
                }
            }
            break;
        default:
            break;
        }

        const entry = this.push({
            source: 'local',
            kind: name,
            icon: kind.icon,
            verb: kind.verb,
            targetName,
            extraName: before && before.name,
            diff: handle.diff || null,
            undoable: Boolean(inverse)
        });
        // Restore re-applies the captured "before" state at any later point
        // from the history (targeted restore, independent of the undo stack).
        const restore = inverse || null;
        if (restore) {
            entry.restore = restore;
            entry.hasRestore = true;
            this.undoStack.unshift({entryId: entry.id, inverse, label: entry});
            if (this.undoStack.length > MAX_UNDO) this.undoStack.pop();
        }
        this.broadcastAction(entry);
    }

    /**
     * Record a remote action relayed through presence.
     * @param {object} peer presence peer
     * @param {object} action action payload
     */
    recordRemote (peer, action) {
        if (!action || typeof action.kind !== 'string') return;
        const kind = OP_KINDS[action.kind];
        this.push({
            source: 'remote',
            userId: peer.userId,
            username: peer.username,
            kind: action.kind,
            icon: (kind && kind.icon) || 'edit',
            verb: (kind && kind.verb) || 'changedProject',
            targetName: typeof action.targetName === 'string' ? action.targetName : null,
            extraName: typeof action.extraName === 'string' ? action.extraName : null,
            diff: action.diff && typeof action.diff === 'object' ? action.diff : null,
            undoable: false
        });
    }

    /**
     * Record a session-level event (presence, roles, presentation...).
     * @param {object} event {verb, username, targetName, icon}
     */
    recordSession (event) {
        return this.push({
            source: 'session',
            kind: event.kind || 'session',
            icon: event.icon || 'people',
            verb: event.verb,
            username: event.username || null,
            userId: event.userId || null,
            targetName: event.targetName || null,
            extraName: event.extraName || null,
            undoable: false
        });
    }

    push (entry) {
        const record = {
            id: nextId(),
            ts: Date.now(),
            username: 'self',
            ...entry
        };
        this.entries.push(record);
        if (this.entries.length > MAX_ENTRIES) this.entries.shift();
        this.notify();
        return record;
    }

    broadcastAction (entry) {
        try {
            const presence = this.vm && this.vm.dashCollaboration && this.vm.dashCollaboration.presence;
            if (!presence) return;
            const diff = entry.diff && {
                before: typeof entry.diff.before === 'string' ? entry.diff.before.slice(0, 80) : null,
                after: typeof entry.diff.after === 'string' ? entry.diff.after.slice(0, 80) : null,
                summary: typeof entry.diff.summary === 'string' ? entry.diff.summary.slice(0, 80) : undefined
            };
            presence.update({
                action: {
                    kind: entry.kind,
                    targetName: entry.targetName || undefined,
                    extraName: entry.extraName || undefined,
                    diff
                }
            });
            // Actions are events, not state: clear so they do not stick.
            setTimeout(() => presence.update({action: null}), 100);
        } catch (error) {
            // Presence is optional.
        }
    }

    /* ------------------------------------------------------------------ */
    /* Undo / restore                                                      */
    /* ------------------------------------------------------------------ */

    canUndoEntry (entryId) {
        return this.undoStack.some(item => item.entryId === entryId);
    }

    getUndoableEntries () {
        return this.undoStack.map(item => item.label);
    }

    /**
     * Undo one of the local user's own operations.
     * @param {?string} entryId entry to undo; defaults to the most recent
     * @returns {Promise} result of the inverse operation
     */
    async undoEntry (entryId) {
        const index = entryId ?
            this.undoStack.findIndex(item => item.entryId === entryId) :
            0;
        if (index < 0) throw new Error('This action cannot be undone');
        const [item] = this.undoStack.splice(index, 1);
        try {
            const result = item.inverse();
            await result;
        } finally {
            this.push({
                source: 'local',
                kind: 'undo',
                icon: 'undo',
                verb: 'undidAction',
                targetName: item.label.targetName || null,
                undoable: false
            });
        }
        return true;
    }

    /**
     * Targeted restore from the history: re-applies the captured "before"
     * state of a specific entry (bring back a deleted sprite/costume/sound,
     * roll a name back) even long after the change happened.
     * @param {string} entryId entry to restore from
     * @returns {Promise} result of the restore operation
     */
    async restoreEntry (entryId) {
        const entry = this.entries.find(item => item.id === entryId);
        if (!entry) throw new Error('Entry not found');
        if (typeof entry.restore !== 'function') throw new Error('This change cannot be restored');
        // Restoring the before-state makes the matching undo slot redundant.
        const index = this.undoStack.findIndex(item => item.entryId === entryId);
        if (index >= 0) this.undoStack.splice(index, 1);
        try {
            await entry.restore();
        } finally {
            this.push({
                source: 'local',
                kind: 'restore',
                icon: 'undo',
                verb: 'restoredEntry',
                targetName: entry.targetName || null,
                undoable: false
            });
        }
        return true;
    }

    /* ------------------------------------------------------------------ */
    /* Name lookups (best-effort, before the change is applied)            */
    /* ------------------------------------------------------------------ */

    currentCostumeName (vm, index) {
        try {
            const target = vm && vm.editingTarget;
            const costumes = target && target.getCostumes ? target.getCostumes() : null;
            const costume = costumes && costumes[index];
            return costume ? costume.name : null;
        } catch (error) {
            return null;
        }
    }

    currentSoundName (vm, index) {
        try {
            const target = vm && vm.editingTarget;
            const sounds = target && target.getSounds ? target.getSounds() : null;
            const sound = sounds && sounds[index];
            return sound ? sound.name : null;
        } catch (error) {
            return null;
        }
    }

    spriteNameFromArg (arg) {
        try {
            if (typeof arg !== 'string') return null;
            const parsed = JSON.parse(arg);
            return parsed && parsed.name ? parsed.name : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Short human summary of a sprite (for delete diffs).
     * @param {VirtualMachine} vm the VM
     * @param {string} targetId sprite id
     * @returns {?string} e.g. "3 costumes, 2 sounds, 12 blocks"
     */
    targetSummary (vm, targetId) {
        try {
            const target = vm && vm.runtime && vm.runtime.getTargetById && vm.runtime.getTargetById(targetId);
            if (!target) return null;
            const costumes = target.getCostumes ? target.getCostumes().length : 0;
            const sounds = target.getSounds ? target.getSounds().length : 0;
            const blocks = target.blocks && target.blocks._blocks ? Object.keys(target.blocks._blocks).length : null;
            const parts = [`${costumes} costume(s)`, `${sounds} sound(s)`];
            if (blocks !== null) parts.push(`${blocks} block(s)`);
            return parts.join(', ');
        } catch (error) {
            return null;
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
                // Listener errors must never break the feed.
            }
        }
    }

    getState () {
        return {
            entries: [...this.entries].reverse(),
            undoable: this.getUndoableEntries()
        };
    }
}

const activity = new DashActivity();

export default activity;
export {OP_KINDS};
