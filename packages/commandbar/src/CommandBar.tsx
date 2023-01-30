import React, { useCallback, useEffect, useReducer, useRef } from 'react';

import * as styles from './CommandBar.module.css';
import { ACTIONS, commandBarReducer } from './state/commandBarReducer';
import { CommandBarFooter, CommandBarHeader, CommandList, CommandResultsView } from './components';
import { clamp, flattenCommands, logger } from './helpers';
import useFunctionRef from './hooks/useFunctionRef';

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
    result: null,
    highlightedResultItem: 0,
};

const CommandBar: React.FC<CommandBarProps> = ({ commands, open, toggleOpen }) => {
    const [state, dispatch] = useReducer(commandBarReducer, {
        ...initialState,
        commands: flattenCommands(commands),
        availableCommandIds: Object.keys(commands),
    });
    const dialogRef = useRef<HTMLDialogElement>(null);

    const handleKeyEnteredRef = useFunctionRef((e: KeyboardEvent | React.KeyboardEvent<HTMLElement>) => {
        if (!open || e.defaultPrevented) {
            return;
        }
        if (e.key === 'k' && e.metaKey && dialogRef?.current.contains(e.target as Node)) {
            // Close command bar
            toggleOpen();
        } else if (e.key === 'Escape') {
            // Cancel search, or selection, or close command bar
            e.stopPropagation();
            e.preventDefault();
            if (state.selectedCommandGroup || state.searchWord) {
                dispatch({ type: ACTIONS.CANCEL });
            } else {
                // Close command bar if cancel is noop
                toggleOpen();
            }
        } else if (e.key === 'ArrowDown') {
            // Navigate to next command
            e.stopPropagation();
            e.preventDefault();
            dispatch({ type: ACTIONS.HIGHLIGHT_NEXT_ITEM });
        } else if (e.key === 'ArrowUp') {
            // Navigate to previous command
            e.stopPropagation();
            e.preventDefault();
            dispatch({ type: ACTIONS.HIGHLIGHT_PREVIOUS_ITEM });
        } else if (e.key === 'Enter' && state.availableCommandIds.length > state.highlightedItem) {
            // Execute highlighted command
            e.stopPropagation();
            e.preventDefault();
            if (state.result) {
                const command = Object.values(state.result.options)[state.highlightedResultItem];
                handleSelectItem(command);
            } else {
                const commandId = state.availableCommandIds[state.highlightedItem];
                handleSelectItem(commandId);
            }
        }
    });

    const handleSearch = useCallback((e) => {
        dispatch({ type: ACTIONS.UPDATE_SEARCH, searchWord: e.target.value.toLowerCase() });
    }, []);

    const handleSelectItem = useCallback(
        async (command: CommandId | ProcessedCommandItem) => {
            const {
                action,
                canHandleQueries,
                id: commandId,
            } = typeof command === 'string' ? state.commands[command] : command;
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
                        logger.debug('Command result', result);
                    })
                    .catch((error) => {
                        // TODO: Show error message
                        logger.error('Command error', error);
                    })
                    .finally(() => {
                        dispatch({ type: ACTIONS.FINISHED_COMMAND });
                    });
            } else if ((actionResult as CommandGeneratorResult).next) {
                // Handle generators
                const generator = actionResult as CommandGeneratorResult;
                // TODO: Handle errors / success === false
                for await (const result of generator) {
                    dispatch({ type: ACTIONS.RUNNING_COMMAND, commandId, argument: result.message });
                    if (result.options) {
                        dispatch({ type: ACTIONS.SET_RESULT, result });
                    }
                }
                dispatch({ type: ACTIONS.FINISHED_COMMAND });
            } else {
                logger.error('Command result is not a promise or generator', actionResult);
            }
        },
        [state.searchWord, state.commands]
    );

    const handleSelectItemRef = useFunctionRef((commandId: CommandId) => {
        handleSelectItem(commandId);
    });

    /**
     * Add key event handler, needs to be updated when any parameter for the key event handler changes
     */
    useEffect(() => {
        if (!open) return;

        // const guestFrame = document.getElementsByName('neos-content-main')[0] as HTMLIFrameElement;
        // guestFrame.contentWindow?.addEventListener('keyup', (e) => {
        //     log.debug('keypress in guestframe', e);
        // });
        // log.debug('guestFrame', guestFrame.contentWindow);

        const windowKeyEventHandler = (e) => handleKeyEnteredRef.current(e);

        window.addEventListener('keydown', windowKeyEventHandler);
        return () => window.removeEventListener('keydown', windowKeyEventHandler);
    }, [open]);

    if (!open) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className={[styles.commandBar, state.result && styles.hasResults].join(' ')}
            open={open}
        >
            <CommandBarHeader
                selectedCommandGroup={state.selectedCommandGroup}
                searchWord={state.searchWord}
                handleBack={() => dispatch({ type: ACTIONS.GO_TO_PARENT_GROUP })}
                handleSearch={handleSearch}
                disabled={!!state.result}
            />
            <div
                className={[styles.resultsWrap, state.expanded && styles.expanded, state.result && styles.split].join(
                    ' '
                )}
            >
                <CommandList
                    commands={state.commands}
                    availableCommandIds={state.availableCommandIds}
                    highlightedItem={state.highlightedItem}
                    handleSelectItem={(commandId: string) => handleSelectItemRef.current(commandId)}
                    runningCommandId={state.runningCommandId}
                    disabled={!!state.result}
                />
                {state.result && (
                    <CommandResultsView result={state.result} highlightedItem={state.highlightedResultItem} />
                )}
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
