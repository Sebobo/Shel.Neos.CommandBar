import * as React from 'react';
import { useCallback, useEffect, useReducer } from 'react';

import * as styles from './CommandBar.module.css';
import { commandBarReducer, ACTIONS } from './state/commandBarReducer';
import CommandBarFooter from './CommandBarFooter/CommandBarFooter';
import CommandBarHeader from './CommandBarHeader/CommandBarHeader';
import CommandListing from './CommandList/CommandListing';

type CommandBarProps = {
    commands: HierarchicalCommandList;
    open: boolean;
    toggleOpen: () => void;
};

const initialState: CommandBarState = {
    expanded: false,
    selectedCommandGroup: null,
    availableCommandIds: [],
    searchWord: '',
    highlightedItem: 0,
    commands: {},
    runningCommandId: null,
    runningCommandMessage: null,
};

/**
 * This method converts the hierarchical command list into a flat list of commands which is more convenient
 * for internal processing, whereas the hierarchical command list is more convenient for the user.
 */
function flattenCommands(commands: HierarchicalCommandList, parentId: CommandId = null): FlatCommandList {
    return Object.keys(commands).reduce((commandList, commandId) => {
        const { icon, description, name, subCommands, action, canHandleQueries } = commands[commandId] as Command &
            CommandGroup;

        // Create an uniquely identifiable command id for the flat command list
        const absoluteCommandId = parentId ? `${parentId}.${commandId}` : commandId;

        // Create list of available subcommand names
        const subCommandIds = subCommands
            ? Object.keys(subCommands).map((subCommandId) => `${absoluteCommandId}.${subCommandId}`)
            : [];

        // Insert the processed command into the flat command list
        commandList[absoluteCommandId] = {
            id: absoluteCommandId,
            name,
            icon,
            description,
            action,
            canHandleQueries,
            subCommandIds,
            parentId,
        };

        // Insert subcommands into the list
        if (subCommandIds.length > 0) {
            return {
                ...commandList,
                ...flattenCommands(subCommands, absoluteCommandId),
            };
        }
        return commandList;
    }, {} as FlatCommandList);
}

const CommandBar: React.FC<CommandBarProps> = ({ commands, open, toggleOpen }) => {
    const [state, dispatch] = useReducer(commandBarReducer, {
        ...initialState,
        commands: flattenCommands(commands),
        availableCommandIds: Object.keys(commands),
    });

    const handleKeyEntered = useCallback(
        (e: KeyboardEvent | React.KeyboardEvent<HTMLInputElement>) => {
            if (!open) {
                return;
            }
            if (e.key === 'Escape') {
                if (state.selectedCommandGroup || state.searchWord) {
                    dispatch({ type: ACTIONS.CANCEL });
                } else {
                    // Close command bar if cancel is noop
                    toggleOpen();
                }
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                dispatch({ type: ACTIONS.HIGHLIGHT_NEXT_ITEM });
                e.stopPropagation();
            } else if (e.key === 'ArrowUp') {
                dispatch({ type: ACTIONS.HIGHLIGHT_PREVIOUS_ITEM });
                e.stopPropagation();
            } else if (e.key === 'Enter' && state.availableCommandIds.length > state.highlightedItem) {
                const commandId = state.availableCommandIds[state.highlightedItem];
                handleSelectItem(commandId);
                e.stopPropagation();
            }
        },
        [state.availableCommandIds, state.highlightedItem, state.searchWord, open]
    );

    const handleSearch = useCallback((e) => {
        dispatch({ type: ACTIONS.UPDATE_SEARCH, argument: e.target.value.toLowerCase() });
    }, []);

    const handleSelectItem = useCallback(
        async (commandId: CommandId) => {
            const { action, canHandleQueries } = state.commands[commandId];
            if (!action) {
                return dispatch({ type: ACTIONS.SELECT_GROUP, commandId });
            }
            // FIXME: Show loading indicator and block further actions while command is running or url is opened
            if (typeof action == 'string') {
                dispatch({ type: ACTIONS.RUNNING_COMMAND, commandId, argument: 'Loading url' });
                window.location.href = action;
                return;
            }
            dispatch({ type: ACTIONS.RUNNING_COMMAND, commandId, argument: 'Running command' });
            const actionResult = action(canHandleQueries ? state.searchWord : undefined);
            if ((actionResult as AsyncCommandResult).then) {
                // Handle Promises
                (actionResult as AsyncCommandResult)
                    .then((result) => {
                        // TODO: Handle success === false
                        console.debug('Command result', result);
                    })
                    .catch((error) => {
                        // TODO: Show error message
                        console.error('Command error', error);
                    })
                    .finally(() => {
                        dispatch({ type: ACTIONS.FINISHED_COMMAND });
                    });
            } else if ((actionResult as CommandGeneratorResult).next) {
                // Handle generators
                const generator = actionResult as CommandGeneratorResult;
                // TODO: Handle errors / success === false
                for await (const result of generator) {
                    console.debug('next value', result);
                    dispatch({ type: ACTIONS.RUNNING_COMMAND, commandId, argument: result.message });
                }
                dispatch({ type: ACTIONS.FINISHED_COMMAND });
            }
        },
        [state.searchWord, state.commands]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyEntered, true);
        return () => {
            document.removeEventListener('keydown', handleKeyEntered, true);
        };
    }, []);

    if (!open) {
        return null;
    }

    return (
        <dialog className={styles.commandBar} open={open}>
            <CommandBarHeader
                selectedCommandGroup={state.selectedCommandGroup}
                searchWord={state.searchWord}
                dispatch={dispatch}
                handleSearch={handleSearch}
                handleKeyEntered={handleKeyEntered}
            />
            <div className={[styles.resultsWrap, state.expanded && styles.expanded].join(' ')}>
                <CommandListing
                    commands={state.commands}
                    availableCommandIds={state.availableCommandIds}
                    highlightedItem={state.highlightedItem}
                    handleSelectItem={handleSelectItem}
                />
            </div>
            {state.expanded && (
                <CommandBarFooter
                    selectedGroup={state.selectedCommandGroup ? state.commands[state.selectedCommandGroup] : null}
                    runningCommand={state.runningCommandId ? state.commands[state.runningCommandId] : null}
                    runningCommandMessage={state.runningCommandMessage}
                />
            )}
        </dialog>
    );
};

export default CommandBar;
