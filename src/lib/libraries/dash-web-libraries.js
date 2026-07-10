const webLibraries = {
    dash: {
        getAssetURL: path => `https://raw.githubusercontent.com/DashBlocks/assets/refs/heads/main${path}`
    }
};

export const getAssetURL = (library, path) => webLibraries[library]?.getAssetURL?.(path);
