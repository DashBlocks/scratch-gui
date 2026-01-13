const SET_STAGE_MODE = 'dash/SET_STAGE_MODE';

const initialState = {
    stageMode: '2d'
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_STAGE_MODE:
        return {
            stageMode: action.stageMode
        };
    default:
        return state;
    }
};

const setStageMode = function (stageMode) {
    return {
        type: SET_STAGE_MODE,
        stageMode: stageMode
    };
};

export {
    reducer as default,
    initialState as dashInitialState,
    setStageMode
};
