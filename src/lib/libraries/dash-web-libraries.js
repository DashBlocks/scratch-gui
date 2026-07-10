const webLibraries = {
    dash: {
        getAssetURL: path => `https://raw.githubusercontent.com/DashBlocks/assets/refs/heads/main${path}`,
        handleAssetLoad: (path, handleUpload) => {
            try {
                const res = await fetch(`https://raw.githubusercontent.com/DashBlocks/assets/refs/heads/main${path}`);
                const blob = await res.blob();
                handleUpload(await blob.arrayBuffer(), blob.type);
            } catch (_) {
                // ignore
            }
        }
    }
};

export const getAssetURL = (library, path) => webLibraries[library]?.getAssetURL?.(path);

export const handleAssetLoad = (library, path, handleUpload) =>
    webLibraries[library]?.handleAssetLoad?.(path, handleUpload);
