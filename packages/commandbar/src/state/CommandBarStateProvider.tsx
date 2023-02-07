import React, { createContext, useContext, useMemo, useReducer } from 'react';

import { commandBarReducer, CommandBarState } from './commandBarReducer';
import { flattenCommands } from '../helpers';
import { STATUS, TRANSITION } from './commandBarMachine';

interface CommandBarContextProps {
    commands: HierarchicalCommandList;
    children: React.ReactElement;
}

interface CommandBarContextValues {
    state: CommandBarState;
    actions: Record<TRANSITION, (...any) => void>;
}

const CommandBarContext = createContext({} as CommandBarContextValues);
export const useCommandBarState = (): CommandBarContextValues => useContext(CommandBarContext);

export const CommandBarStateProvider: React.FC<CommandBarContextProps> = ({ commands, children }) => {
    const [state, dispatch] = useReducer(commandBarReducer, {
        status: STATUS.COLLAPSED,
        availableCommandIds: Object.keys(commands),
        commands: flattenCommands(commands),
        expanded: false,
        highlightedItem: 0,
        highlightedOption: 0,
        result: null,
        activeCommandId: null,
        activeCommandMessage: null,
        searchWord: '',
        selectedCommandGroup: null,
    });

    // Provide all actions as shorthand functions
    const actions: Record<TRANSITION, (...any) => void> = useMemo(() => {
        return {
            [TRANSITION.RESET_SEARCH]: () => dispatch({ type: TRANSITION.RESET_SEARCH }),
            [TRANSITION.HIGHLIGHT_NEXT_ITEM]: () => dispatch({ type: TRANSITION.HIGHLIGHT_NEXT_ITEM }),
            [TRANSITION.HIGHLIGHT_PREVIOUS_ITEM]: () => dispatch({ type: TRANSITION.HIGHLIGHT_PREVIOUS_ITEM }),
            [TRANSITION.CANCEL]: () => dispatch({ type: TRANSITION.CANCEL }),
            [TRANSITION.SELECT_GROUP]: (commandId: CommandId) => dispatch({ type: TRANSITION.SELECT_GROUP, commandId }),
            [TRANSITION.GO_TO_PARENT_GROUP]: () => dispatch({ type: TRANSITION.GO_TO_PARENT_GROUP }),
            [TRANSITION.UPDATE_SEARCH]: (searchWord: string) =>
                dispatch({ type: TRANSITION.UPDATE_SEARCH, searchWord }),
            [TRANSITION.EXECUTE_COMMAND]: (commandId: CommandId, argument: string) =>
                dispatch({
                    type: TRANSITION.EXECUTE_COMMAND,
                    commandId,
                    argument,
                }),
            [TRANSITION.FINISH_COMMAND]: () => dispatch({ type: TRANSITION.FINISH_COMMAND }),
            [TRANSITION.UPDATE_RESULT]: (result: CommandResult) => dispatch({ type: TRANSITION.UPDATE_RESULT, result }),
            [TRANSITION.EXPAND]: () => dispatch({ type: TRANSITION.EXPAND }),
        };
    }, []);

    return <CommandBarContext.Provider value={{ state, actions }}>{children}</CommandBarContext.Provider>;
};
