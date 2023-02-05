import React, { useCallback, useEffect } from 'react';

import useFunctionRef from '../hooks/useFunctionRef';
import { useCommandBarState } from './CommandBarStateProvider';
import { logger } from '../helpers';

interface CommandInputContextProps {
    children: React.ReactElement | React.ReactElement[];
    toggleOpen: () => void;
    dialogRef: React.RefObject<HTMLDialogElement>;
}

interface CommandInputContextValues {
    executeCommand: (commandId: CommandId) => void;
}

const CommandInputContext = React.createContext({} as CommandInputContextValues);
export const useCommandInput = (): CommandInputContextValues => React.useContext(CommandInputContext);

export const CommandBarInputProvider: React.FC<CommandInputContextProps> = ({ children, toggleOpen, dialogRef }) => {
    const { state, actions } = useCommandBarState();

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
        } else if (e.key === 'Enter' && state.availableCommandIds.length > state.highlightedItem) {
            // Execute highlighted command
            e.stopPropagation();
            e.preventDefault();
            const commandId = state.result?.options
                ? Object.keys(state.result.options)[state.highlightedResultItem]
                : state.availableCommandIds[state.highlightedItem];
            executeCommand(commandId);
        }
    });

    const executeCommand = useCallback(
        async (command: CommandId | ProcessedCommandItem) => {
            let commandObject = command;

            if (typeof command === 'string') {
                commandObject = state.result?.options[command] ?? state.commands[command];
            }

            const { action, canHandleQueries, id: commandId } = commandObject as ProcessedCommandItem;

            // If the command is a group, select it
            if (!action) {
                actions.SELECT_GROUP(commandId);
                return;
            }

            // If the command is a url, open it
            // FIXME: Show loading indicator and block further actions while command is running or url is opened
            if (typeof action == 'string') {
                actions.RUNNING_COMMAND(commandId, 'Loading url');
                window.location.href = action;
                return;
            }

            // If the command is a function, execute it
            actions.RUNNING_COMMAND(commandId, 'Running command');
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
                        actions.FINISHED_COMMAND();
                    });
            } else if ((actionResult as CommandGeneratorResult).next) {
                // Handle generators
                const generator = actionResult as CommandGeneratorResult;
                // TODO: Handle errors / success === false
                for await (const result of generator) {
                    actions.RUNNING_COMMAND(commandId, result.message);
                    if (result.options) {
                        actions.SET_RESULT(result);
                    }
                }
                actions.FINISHED_COMMAND();
            } else {
                logger.error('Command result is not a promise or generator', actionResult);
            }
        },
        [state.searchWord, state.commands, state.result?.options]
    );

    const executeCommandRef = useFunctionRef((commandId: CommandId) => {
        executeCommand(commandId);
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
