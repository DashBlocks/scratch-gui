const SET_STAGE_MODE = 'dash/SET_STAGE_MODE';
const SET_CONSOLE_LINES = 'dash/SET_CONSOLE_LINES';
const SET_CONSOLE_CURSOR = 'dash/SET_CONSOLE_CURSOR';

const initialState = {
    stageMode: '2d',
    consoleLines: new Array(),
    consoleCursor: {
        row: 0,
        symbol: 0
    }
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_STAGE_MODE:
        return Object.assign({}, state, {
            stageMode: action.stageMode
        });
    case SET_CONSOLE_LINES:
        return Object.assign({}, state, {
            consoleLines: action.lines
        });
    case SET_CONSOLE_CURSOR:
        return Object.assign({}, state, {
            consoleCursor: Object.assign({}, state.consoleCursor, action.cursorPos)
        });
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

const setConsoleLines = function (lines) {
    return {
        type: SET_CONSOLE_LINES,
        lines: lines
    };
}

const setConsoleCursor = function (cursorPos) {
    return {
        type: SET_CONSOLE_CURSOR,
        cursorPos: cursorPos
    };
}

export {
    reducer as default,
    initialState as dashInitialState,
    setStageMode,
    setConsoleLines,
    setConsoleCursor
};
