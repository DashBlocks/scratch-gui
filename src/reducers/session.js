const SET_SESSION = 'scratch-gui/session/SET_SESSION';

const initialState = null;

export default function (state, action) {
    if (typeof state === 'undefined') {
        state = initialState;
    }
    switch (action.type) {
    case SET_SESSION:
        return action.session;
    default:
        return state;
    }
}

export const setSession = session => ({
    type: SET_SESSION,
    session: session
});
export {initialState as sessionInitialState};
