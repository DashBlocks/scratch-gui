import DragConstants from '../drag-constants';

let confirmFolder = () => Promise.resolve(false);
const setBackpackFolderConfirmation = callback => {
    confirmFolder = callback;
};
const confirmBackpackFolder = () => confirmFolder();

const expandBackpackDrop = ({dragType, payload}) => {
    const folderItems = payload && payload.sa_folder_items;
    if (Array.isArray(folderItems)) {
        return folderItems.map(item => {
            const child = dragType === DragConstants.SPRITE ? item.id : item.dragPayload;
            if (!child || child.sa_folder_items) throw new Error('Invalid backpack folder item');
            return {dragType, payload: typeof child === 'object' ? {...child} : child};
        });
    }
    if (payload && typeof payload === 'object' && typeof payload.name === 'object') {
        if (typeof payload.name.realName !== 'string') throw new Error('Invalid backpack asset name');
        return [{dragType, payload: {...payload, name: payload.name.realName}}];
    }
    return [{dragType, payload: typeof payload === 'object' ? {...payload} : payload}];
};

export {confirmBackpackFolder, setBackpackFolderConfirmation};
export default expandBackpackDrop;
