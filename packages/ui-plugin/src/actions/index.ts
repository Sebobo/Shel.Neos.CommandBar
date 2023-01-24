import { createAction, handleActions } from 'redux-actions';

export const actionTypes = {
    TOGGLE_COMMAND_BAR: 'TOGGLE_COMMAND_BAR',
};

const toggleCommandBar = createAction(actionTypes.TOGGLE_COMMAND_BAR);

export const actions = {
    toggleCommandBar,
};

export const reducer = handleActions(
    {
        TOGGLE_COMMAND_BAR: (state, action) => ({
            ...state,
            plugins: {
                ...state.plugins,
                commandBar: {
                    open: action.payload?.open !== undefined ? action.payload.open : !state.plugins?.commandBar?.open,
                },
            },
        }),
    },
    {
        plugins: {
            commandBar: {
                open: false,
            },
        },
    }
);

export const selectors = {
    commandBarOpen: (state) => state.plugins?.commandBar?.open,
};
