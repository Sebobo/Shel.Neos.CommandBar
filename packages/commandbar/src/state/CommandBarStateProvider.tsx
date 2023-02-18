import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

import { commandBarReducer, CommandBarState } from './commandBarReducer';
import { flattenCommands, logger } from '../helpers';
import { STATUS, TRANSITION } from './commandBarMachine';
import { IconWrapper } from '../components';

interface CommandBarContextProps {
    commands: HierarchicalCommandList;
    children: JSX.Element;
    IconComponent: React.FC<IconProps>;
    userPreferencesService: UserPreferencesService;
}

interface CommandBarContextValues {
    state: CommandBarState;
    actions: Record<TRANSITION, (...any) => void>;
    Icon: Renderable<IconProps>;
}

const CommandBarContext = createContext({} as CommandBarContextValues);
export const useCommandBarState = (): CommandBarContextValues => useContext(CommandBarContext);

export const CommandBarStateProvider: React.FC<CommandBarContextProps> = ({
    commands,
    children,
    IconComponent,
    userPreferencesService,
}) => {
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
        favourites: userPreferencesService.getFavourites(),
        recentlyUsed: userPreferencesService.getRecentlyUsed(),
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
            [TRANSITION.ADD_FAVOURITE]: (commandId: CommandId) =>
                dispatch({ type: TRANSITION.ADD_FAVOURITE, commandId }),
            [TRANSITION.REMOVE_FAVOURITE]: (commandId: CommandId) =>
                dispatch({ type: TRANSITION.REMOVE_FAVOURITE, commandId }),
        };
    }, []);

    useEffect(() => {
        userPreferencesService
            .setFavourites(state.favourites)
            .catch((e) => logger.error('Could not load favourites', e));
    }, [state.favourites]);

    useEffect(() => {
        userPreferencesService
            .setRecentlyUsed(state.recentlyUsed)
            .catch((e) => logger.error('Could not load recently used commands', e));
    }, [state.recentlyUsed]);

    const Icon: React.FC<IconProps> = useCallback(({ icon, spin = false }) => {
        return (
            <IconWrapper>
                <IconComponent icon={icon} spin={spin} />
            </IconWrapper>
        );
    }, []);

    return <CommandBarContext.Provider value={{ state, actions, Icon }}>{children}</CommandBarContext.Provider>;
};
