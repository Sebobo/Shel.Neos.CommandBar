import { createAction, handleActions } from 'redux-actions';
import { DefaultRootState } from 'react-redux';

export const actionTypes = {
    TOGGLE_COMMAND_BAR: 'TOGGLE_COMMAND_BAR',
};

// Type safety helper as the Neos extensibility doesn't provide a type for the global state
export interface NeosRootState extends DefaultRootState {
    ui?: {
        contentCanvas?: {
            previewUrl?: string;
        };
    };
    plugins?: {
        commandBar?: {
            open?: boolean;
        };
    };
}

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
    commandBarOpen: (state: NeosRootState) => state.plugins?.commandBar?.open,
    previewUrl: (state: NeosRootState) => state.ui?.contentCanvas?.previewUrl,
};
