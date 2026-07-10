const asyncLibrary = (...callbacks) => {
    let data = null;
    return () => {
        if (data) return data;
        return Promise.all(callbacks.map(clbk => clbk()))
            .then(modules => {
                const sortedData = modules.map(mod => mod.default)
                    .reduce((acc, data) => acc.concat(...data))
                    .sort((item1, item2) => {
                        if (item1.name === item2.name) return 0;
                        if (item1.name > item2.name) return 1;
                        if (item1.name < item2.name) return -1;
                    });
                return (data = sortedData);
            });
    };
};

export const getBackdropLibrary = asyncLibrary(
    () => import(/* webpackChunkName: "library-backdrops" */ './backdrops.json'),
    () => import(/* webpackChunkName: "dash-library-backdrops" */ './dash-assets/generated-backdrops.json')
);
export const getCostumeLibrary = asyncLibrary(
    () => import(/* webpackChunkName: "library-costumes" */ './costumes.json'),
    () => import(/* webpackChunkName: "dash-library-costumes" */ './dash-assets/generated-costumes.json')
);
export const getSoundLibrary = asyncLibrary(
    () => import(/* webpackChunkName: "library-sounds" */ './sounds.json'),
    () => import(/* webpackChunkName: "dash-library-sounds" */ './dash-assets/generated-sounds.json')
);
export const getSpriteLibrary = asyncLibrary(
    () => import(/* webpackChunkName: "library-sprites" */ './sprites.json')
);
