import React, { createContext, useContext, useMemo, useReducer } from 'react';

import { ACTIONS, commandBarReducer } from './commandBarReducer';
import { flattenCommands } from '../helpers';

interface CommandBarContextProps {
    commands: HierarchicalCommandList;
    children: React.ReactElement;
}

interface CommandBarContextValues {
    state: CommandBarState;
    actions: Record<ACTIONS, (...any) => void>;
}

const CommandBarContext = createContext({} as CommandBarContextValues);
export const useCommandBarState = (): CommandBarContextValues => useContext(CommandBarContext);

export const CommandBarStateProvider: React.FC<CommandBarContextProps> = ({ commands, children }) => {
    const [state, dispatch] = useReducer(commandBarReducer, {
        availableCommandIds: Object.keys(commands),
        commands: flattenCommands(commands),
        expanded: false,
        highlightedItem: 0,
        highlightedResultItem: 0,
        result: null,
        runningCommandId: null,
        runningCommandMessage: null,
        searchWord: '',
        selectedCommandGroup: null,
    });

    // Provide all actions as shorthand functions
    const actions: Record<ACTIONS, (...any) => void> = useMemo(() => {
        return {
            [ACTIONS.RESET_SEARCH]: () => dispatch({ type: ACTIONS.RESET_SEARCH }),
            [ACTIONS.HIGHLIGHT_NEXT_ITEM]: () => dispatch({ type: ACTIONS.HIGHLIGHT_NEXT_ITEM }),
            [ACTIONS.HIGHLIGHT_PREVIOUS_ITEM]: () => dispatch({ type: ACTIONS.HIGHLIGHT_PREVIOUS_ITEM }),
            [ACTIONS.CANCEL]: () => dispatch({ type: ACTIONS.CANCEL }),
            [ACTIONS.SELECT_GROUP]: (commandId: CommandId) => dispatch({ type: ACTIONS.SELECT_GROUP, commandId }),
            [ACTIONS.GO_TO_PARENT_GROUP]: () => dispatch({ type: ACTIONS.GO_TO_PARENT_GROUP }),
            [ACTIONS.UPDATE_SEARCH]: (searchWord: string) => dispatch({ type: ACTIONS.UPDATE_SEARCH, searchWord }),
            [ACTIONS.RUNNING_COMMAND]: (commandId: CommandId, argument: string) =>
                dispatch({
                    type: ACTIONS.RUNNING_COMMAND,
                    commandId,
                    argument,
                }),
            [ACTIONS.FINISHED_COMMAND]: () => dispatch({ type: ACTIONS.FINISHED_COMMAND }),
            [ACTIONS.SET_RESULT]: (result: CommandResult) => dispatch({ type: ACTIONS.SET_RESULT, result }),
        };
    }, []);

    return <CommandBarContext.Provider value={{ state, actions }}>{children}</CommandBarContext.Provider>;
};
