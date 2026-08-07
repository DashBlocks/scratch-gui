import VM from 'scratch-vm';
import log from '../lib/log';
import storage from '../lib/storage';
import {MAXIMUM_CLOUD_VARIABLES} from '../lib/tw-cloud-limits';

const SET_VM = 'scratch-gui/vm/SET_VM';
let defaultVM;
try {
    defaultVM = new VM();
    defaultVM.setCompatibilityMode(true);
    defaultVM.runtime.cloudOptions.limit = MAXIMUM_CLOUD_VARIABLES;
    defaultVM.attachStorage(storage);
} catch (error) {
    log.warn('Tried to create instance of VM', error);
}
const initialState = defaultVM;

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_VM:
        return action.vm;
    default:
        return state;
    }
};
const setVM = function (vm) {
    return {
        type: SET_VM,
        vm: vm
    };
};

export {
    reducer as default,
    initialState as vmInitialState,
    setVM
};
