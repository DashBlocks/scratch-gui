const webLibraries = {
    dash: {
        getAssetURL: path => `https://raw.githubusercontent.com/DashBlocks/assets/refs/heads/main${path}`,
        handleAsset: (item, vm, handleUpload, handleNewAsset) => {
            try {
                const res = await fetch(`https://raw.githubusercontent.com/DashBlocks/assets/refs/heads/main${item.src.path}`);
                const blob = await res.blob();

                const fileType = blob.type;
                const buffer = await blob.arrayBuffer();

                handleUpload(buffer, fileType, vm, vmAssets => {
                    vmAssets.forEach((asset, i) => {
                        asset.name = `${item.name}${i ? i + 1 : ''}`;
                    });
                    handleNewAsset(vmAssets);
                });
            } catch (_) {
                // ignore
            }
        }
    }
};

export const getAssetURL = (library, path) => webLibraries[library]?.getAssetURL?.(path);

export const handleAsset = (item, vm, handleUpload, handleNewAsset) =>
    webLibraries[item.src?.library]?.handleAsset?.(item, vm, handleUpload, handleNewAsset);
