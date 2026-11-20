import createThumbnail from './thumbnail';

const spritePayload = (id, vm) => {
    const target = vm.runtime.getTargetById(id);
    if (!target) return Promise.reject(new Error('Sprite no longer exists'));

    return vm.exportSprite(
        id,
        'base64'
    ).then(zippedSprite => {
        const payload = {
            type: 'sprite',
            name: target.sprite.name,
            mime: 'application/zip',
            body: zippedSprite,
            // Filled in below
            thumbnail: ''
        };

        const costume = target.sprite.costumes[target.currentCostume] || target.sprite.costumes[0];
        if (!costume?.asset) throw new Error('Sprite has no exportable costume');
        const costumeDataUrl = costume.asset.encodeDataURI();

        return createThumbnail(costumeDataUrl).then(thumbnail => {
            payload.thumbnail = thumbnail;
            return payload;
        });
    });
};

export default spritePayload;
