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
        status: ReadonlySignal<STATUS>;
        expanded: ReadonlySignal<boolean>;
        selectedCommandGroup: ReadonlySignal<CommandId>;
        availableCommandIds: ReadonlySignal<CommandId[]>;
        searchWord: ReadonlySignal<string>;
        highlightedItem: ReadonlySignal<number>;
        commands: ReadonlySignal<FlatCommandList>;
        activeCommandId: ReadonlySignal<CommandId>;
        activeCommandMessage: ReadonlySignal<string>;
        result: ReadonlySignal<CommandResult | null>;
        highlightedOption: ReadonlySignal<number>;
        favouriteCommands: ReadonlySignal<CommandId[]>;
        recentCommands: ReadonlySignal<CommandId[]>;
        showBranding: ReadonlySignal<boolean>;
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
    const commands = computed(() => commandBarState.value.commands);
    const expanded = computed(() => commandBarState.value.expanded);
    const favouriteCommands = computed(() => commandBarState.value.favouriteCommands);
    const highlightedItem = computed(() => commandBarState.value.highlightedItem);
    const highlightedOption = computed(() => commandBarState.value.highlightedOption);
    const recentCommands = computed(() => commandBarState.value.recentCommands);
    const result = computed(() => commandBarState.value.result);
    const searchWord = computed(() => commandBarState.value.searchWord);
    const selectedCommandGroup = computed(() => commandBarState.value.selectedCommandGroup);
    const showBranding = computed(() => commandBarState.value.showBranding);
    const status = computed(() => commandBarState.value.status);

    return {
        state: {
            activeCommandId,
            activeCommandMessage,
            availableCommandIds,
            commands,
            expanded,
            favouriteCommands,
            highlightedItem,
            highlightedOption,
            recentCommands,
            result,
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
            favouriteCommands: userPreferences.favouriteCommands,
            recentCommands: userPreferences.recentCommands,
            showBranding: userPreferences.showBranding,
        });
    }, []);

    // Provide all actions as shorthand functions
    const actions: Record<TRANSITION, (...any) => void | Promise<void>> = useMemo(() => {
        return {
            [TRANSITION.RESET_SEARCH]: () => dispatch({ type: TRANSITION.RESET_SEARCH }),
            [TRANSITION.HIGHLIGHT_NEXT_ITEM]: () => dispatch({ type: TRANSITION.HIGHLIGHT_NEXT_ITEM }),
            [TRANSITION.HIGHLIGHT_PREVIOUS_ITEM]: () => dispatch({ type: TRANSITION.HIGHLIGHT_PREVIOUS_ITEM }),
            [TRANSITION.CANCEL]: () => dispatch({ type: TRANSITION.CANCEL }),
            [TRANSITION.SELECT_GROUP]: (commandId: CommandId) => dispatch({ type: TRANSITION.SELECT_GROUP, commandId }),
            [TRANSITION.GO_TO_PARENT_GROUP]: () => dispatch({ type: TRANSITION.GO_TO_PARENT_GROUP }),
            [TRANSITION.UPDATE_SEARCH]: (searchWord: string) =>
                dispatch({ type: TRANSITION.UPDATE_SEARCH, searchWord }),
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
                userPreferences
                    .setFavouriteCommands(state.favouriteCommands.value)
                    .catch((e) => logger.error('Could not update favourite commands', e));
            },
            [TRANSITION.REMOVE_FAVOURITE]: (commandId: CommandId) => {
                dispatch({ type: TRANSITION.REMOVE_FAVOURITE, commandId });
                userPreferences
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
