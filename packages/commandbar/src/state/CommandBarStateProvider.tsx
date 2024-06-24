import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { signal, computed, ReadonlySignal } from '@preact/signals';

import { CommandBarEvent, commandBarReducer, CommandBarState } from './commandBarReducer';
import { flattenCommands, logger } from '../helpers';
import { STATUS, TRANSITION } from './commandBarMachine';
import { IconWrapper } from '../components';

interface CommandBarContextProps {
    commands: HierarchicalCommandList;
    children: JSX.Element;
    IconComponent: React.FC<IconProps>;
    userPreferences: UserPreferencesService;
}

interface CommandBarContextValues {
    state: {
        activeCommandId: ReadonlySignal<CommandId>;
        activeCommandMessage: ReadonlySignal<string>;
        availableCommandIds: ReadonlySignal<CommandId[]>;
        commandQuery: ReadonlySignal<string>;
        commandQueryDirty: ReadonlySignal<boolean>;
        commands: ReadonlySignal<FlatCommandList>;
        expanded: ReadonlySignal<boolean>;
        favouriteCommands: ReadonlySignal<CommandId[]>;
        highlightedItem: ReadonlySignal<number>;
        highlightedOption: ReadonlySignal<number>;
        recentCommands: ReadonlySignal<CommandId[]>;
        result: ReadonlySignal<CommandResult | null>;
        resultCommandId: ReadonlySignal<CommandId | null>;
        searchWord: ReadonlySignal<string>;
        selectedCommandGroup: ReadonlySignal<CommandId>;
        showBranding: ReadonlySignal<boolean>;
        status: ReadonlySignal<STATUS>;
    };
    actions: Record<TRANSITION, (...any) => void>;
    Icon: Renderable<IconProps>;
}

const CommandBarContext = createContext({} as CommandBarContextValues);
export const useCommandBarState = (): CommandBarContextValues => useContext(CommandBarContext);

/**
 * Create the app state and initialize it if it does not exist yet
 */
function createAppState(initialState: CommandBarState) {
    // Define a signal to hold the state
    const commandBarState = signal(initialState);

    // Define a function to dispatch events to the reducer and its state machine and update the state with the result
    const dispatch = (event: CommandBarEvent) => {
        commandBarState.value = commandBarReducer(commandBarState.value, event);
    };

    // Derive readonly selectors for partial state values
    const activeCommandId = computed(() => commandBarState.value.activeCommandId);
    const activeCommandMessage = computed(() => commandBarState.value.activeCommandMessage);
    const availableCommandIds = computed(() => commandBarState.value.availableCommandIds);
    const commandQuery = computed(() => commandBarState.value.commandQuery);
    const commandQueryDirty = computed(() => commandBarState.value.commandQueryDirty);
    const commands = computed(() => commandBarState.value.commands);
    const expanded = computed(() => commandBarState.value.expanded);
    const favouriteCommands = computed(() => commandBarState.value.favouriteCommands);
    const highlightedItem = computed(() => commandBarState.value.highlightedItem);
    const highlightedOption = computed(() => commandBarState.value.highlightedOption);
    const recentCommands = computed(() => commandBarState.value.recentCommands);
    const result = computed(() => commandBarState.value.result);
    const resultCommandId = computed(() => commandBarState.value.resultCommandId);
    const searchWord = computed(() => commandBarState.value.searchWord);
    const selectedCommandGroup = computed(() => commandBarState.value.selectedCommandGroup);
    const showBranding = computed(() => commandBarState.value.showBranding);
    const status = computed(() => commandBarState.value.status);

    return {
        state: {
            activeCommandId,
            activeCommandMessage,
            availableCommandIds,
            commandQuery,
            commandQueryDirty,
            commands,
            expanded,
            favouriteCommands,
            highlightedItem,
            highlightedOption,
            recentCommands,
            result,
            resultCommandId,
            searchWord,
            selectedCommandGroup,
            showBranding,
            status,
        },
        dispatch,
    };
}

export const CommandBarStateProvider: React.FC<CommandBarContextProps> = ({
    commands,
    children,
    IconComponent,
    userPreferences,
}) => {
    const { state, dispatch } = useMemo(() => {
        return createAppState({
            activeCommandId: null,
            activeCommandMessage: null,
            availableCommandIds: Object.keys(commands),
            commandQuery: '',
            commandQueryDirty: false,
            commands: flattenCommands(commands),
            expanded: false,
            favouriteCommands: userPreferences.favouriteCommands,
            highlightedItem: 0,
            highlightedOption: 0,
            recentCommands: userPreferences.recentCommands,
            result: null,
            resultCommandId: null,
            searchWord: '',
            selectedCommandGroup: null,
            showBranding: userPreferences.showBranding,
            status: STATUS.COLLAPSED,
        });
    }, []);

    // Provide all actions as shorthand functions
    const actions: Record<TRANSITION, (...any) => void | Promise<void | any>> = useMemo(() => {
        return {
            [TRANSITION.RESET_SEARCH]: () => dispatch({ type: TRANSITION.RESET_SEARCH }),
            [TRANSITION.HIGHLIGHT_NEXT_ITEM]: () => dispatch({ type: TRANSITION.HIGHLIGHT_NEXT_ITEM }),
            [TRANSITION.HIGHLIGHT_PREVIOUS_ITEM]: () => dispatch({ type: TRANSITION.HIGHLIGHT_PREVIOUS_ITEM }),
            [TRANSITION.CANCEL]: () => dispatch({ type: TRANSITION.CANCEL }),
            [TRANSITION.SELECT_GROUP]: (commandId: CommandId) => dispatch({ type: TRANSITION.SELECT_GROUP, commandId }),
            [TRANSITION.GO_TO_PARENT_GROUP]: () => dispatch({ type: TRANSITION.GO_TO_PARENT_GROUP }),
            [TRANSITION.UPDATE_SEARCH]: (searchWord: string) =>
                dispatch({ type: TRANSITION.UPDATE_SEARCH, searchWord }),
            [TRANSITION.UPDATE_COMMAND_QUERY]: (commandQuery: string) =>
                dispatch({ type: TRANSITION.UPDATE_COMMAND_QUERY, commandQuery }),
            [TRANSITION.EXECUTE_COMMAND]: async (commandId: CommandId, message: string) => {
                dispatch({
                    type: TRANSITION.EXECUTE_COMMAND,
                    commandId,
                    message,
                });
                // Update recent commands in the user preferences when a command is executed
                return userPreferences
                    .addRecentCommand(commandId)
                    .catch((e) => logger.error('Could not add recent command', e));
            },
            [TRANSITION.FINISH_COMMAND]: () => dispatch({ type: TRANSITION.FINISH_COMMAND }),
            [TRANSITION.UPDATE_RESULT]: (result: CommandResult) => dispatch({ type: TRANSITION.UPDATE_RESULT, result }),
            [TRANSITION.EXPAND]: () => dispatch({ type: TRANSITION.EXPAND }),
            [TRANSITION.ADD_FAVOURITE]: (commandId: CommandId) => {
                dispatch({ type: TRANSITION.ADD_FAVOURITE, commandId });
                return userPreferences
                    .setFavouriteCommands(state.favouriteCommands.value)
                    .catch((e) => logger.error('Could not update favourite commands', e));
            },
            [TRANSITION.REMOVE_FAVOURITE]: (commandId: CommandId) => {
                dispatch({ type: TRANSITION.REMOVE_FAVOURITE, commandId });
                return userPreferences
                    .setFavouriteCommands(state.favouriteCommands.value)
                    .catch((e) => logger.error('Could not update favourite commands', e));
            },
        };
    }, []);

    const Icon: React.FC<IconProps> = useCallback(({ icon, spin = false }) => {
        return (
            <IconWrapper>
                <IconComponent icon={icon} spin={spin} />
            </IconWrapper>
        );
    }, []);

    return <CommandBarContext.Provider value={{ state, actions, Icon }}>{children}</CommandBarContext.Provider>;
};
