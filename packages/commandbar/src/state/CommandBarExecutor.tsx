import React, { useCallback, useEffect } from 'react';

import useFunctionRef from '../hooks/useFunctionRef';
import { useCommandBarState } from './CommandBarStateProvider';
import { assert, logger } from '../helpers';
import { STATUS } from './commandBarMachine';

interface CommandInputContextProps {
    children: React.ReactElement | React.ReactElement[];
    toggleOpen: () => void;
    dialogRef: React.RefObject<HTMLDialogElement>;
    open: boolean;
}

interface CommandInputContextValues {
    executeCommand: (commandId: CommandId) => void;
}

const CommandInputContext = React.createContext({} as CommandInputContextValues);
export const useCommandExecutor = (): CommandInputContextValues => React.useContext(CommandInputContext);

/**
 * Context provider for the command bar input and command execution
 */
export const CommandBarExecutor: React.FC<CommandInputContextProps> = ({ children, toggleOpen, dialogRef, open }) => {
    const { state, actions } = useCommandBarState();

    const handleKeyEnteredRef = useFunctionRef((e: KeyboardEvent | React.KeyboardEvent<HTMLElement>) => {
        if (!open || e.defaultPrevented) {
            return;
        }
        if (e.key === 'k' && e.metaKey && dialogRef?.current.contains(e.target as Node)) {
            // Close command bar
            toggleOpen();
            e.stopPropagation();
            e.preventDefault();
        } else if (e.key === 'Escape') {
            // Cancel search, or selection, or close command bar
            e.stopPropagation();
            e.preventDefault();
            if (state.selectedCommandGroup.value || state.searchWord.value || state.commandQuery.value) {
                actions.CANCEL();
            } else {
                // Close command bar if cancel is noop
                toggleOpen();
            }
        } else if (e.key === 'ArrowDown') {
            // Navigate to next command
            e.stopPropagation();
            e.preventDefault();
            actions.HIGHLIGHT_NEXT_ITEM();
        } else if (e.key === 'ArrowUp') {
            // Navigate to previous command
            e.stopPropagation();
            e.preventDefault();
            actions.HIGHLIGHT_PREVIOUS_ITEM();
        } else if (e.key === 'Enter') {
            // Execute highlighted command
            e.stopPropagation();
            e.preventDefault();

            // Select the highlighted command by default
            let commandId = state.availableCommandIds.value[state.highlightedItem.value];
            if (state.status.value === STATUS.DISPLAYING_RESULT) {
                // If there are options the command to execute is the highlighted option
                if (Object.values(state.result.value.options).length) {
                    commandId = Object.keys(state.result.value.options)[state.highlightedOption.value];
                } else {
                    // If there are no options we run the command which generated the result again
                    commandId = state.resultCommandId.value;
                }
            }

            if (commandId) {
                void executeCommand(commandId);
            }
        }
    });

    const executeCommand = useCallback(
        async (commandId: CommandId) => {
            const command = state.result.value?.options[commandId] ?? state.commands.value[commandId];
            const { action, canHandleQueries, subCommandIds, name } = command;

            // If the command is a group, select it
            if (subCommandIds?.length > 0) {
                actions.SELECT_GROUP(commandId);
                return;
            }

            assert(action, `Command ${commandId} has no action`);

            // If the command is a url, open it
            if (typeof action == 'string') {
                // We wait for the state change to be finished before opening the url
                await actions.EXECUTE_COMMAND(commandId, 'Loading url');

                // We need to check if the url is in the same domain, otherwise we need to open it in a new tab
                // TODO: We should add another option to a link command to define its target
                if (action.indexOf('http') === 0 && action.indexOf(document.location.origin) !== 0) {
                    window.open(action, '_blank', 'noopener,noreferrer')?.focus();
                } else {
                    window.location.href = action;
                }
                return actions.FINISH_COMMAND();
            }

            // If the command is a function, execute it
            actions.EXECUTE_COMMAND(commandId, 'Running command');
            const actionResult = action(canHandleQueries ? state.commandQuery.value : undefined);
            if ((actionResult as AsyncCommandResult).then) {
                // Handle Promises
                (actionResult as AsyncCommandResult)
                    .then((result) => {
                        if (result && !result.success) {
                            throw new Error(`The command "${name}" failed`);
                        }
                    })
                    .catch((error) => {
                        // TODO: Show an error message to the user
                        logger.error('Command error', name, error);
                    })
                    .finally(() => {
                        actions.FINISH_COMMAND();
                    });
            } else if ((actionResult as CommandGeneratorResult).next) {
                // Handle generators
                const generator = actionResult as CommandGeneratorResult;
                // TODO: Handle errors / success === false
                for await (const result of generator) {
                    actions.UPDATE_RESULT(result);
                }
                actions.FINISH_COMMAND();
            } else {
                logger.error('Command result is not a promise or generator', actionResult);
            }

            if (command.closeOnExecute) {
                toggleOpen();
            }
        },
        [state.searchWord, state.commands, state.result]
    );

    const executeCommandRef = useFunctionRef((commandId: CommandId) => {
        void executeCommand(commandId);
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

    return (
        <CommandInputContext.Provider value={{ executeCommand: executeCommandRef.current }}>
            {children}
        </CommandInputContext.Provider>
    );
};
