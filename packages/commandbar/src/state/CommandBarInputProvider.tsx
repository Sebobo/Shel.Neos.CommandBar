import React, { useCallback, useEffect } from 'react';

import useFunctionRef from '../hooks/useFunctionRef';
import { useCommandBarState } from './CommandBarStateProvider';
import { assert, logger } from '../helpers';
import { STATUS } from './commandBarMachine';

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
            const commandId =
                state.status === STATUS.DISPLAYING_RESULT
                    ? Object.keys(state.result.options)[state.highlightedOption]
                    : state.availableCommandIds[state.highlightedItem];
            void executeCommand(commandId);
        }
    });

    const executeCommand = useCallback(
        async (commandId: CommandId) => {
            const command = state.result?.options[commandId] ?? state.commands[commandId];
            const { action, canHandleQueries, subCommandIds } = command;

            // If the command is a group, select it
            if (subCommandIds?.length > 0) {
                actions.SELECT_GROUP(commandId);
                return;
            }

            assert(action, `Command ${commandId} has no action`);

            if (command.canHandleQueries && !state.searchWord) {
                return;
            }

            // If the command is a url, open it
            if (typeof action == 'string') {
                actions.EXECUTE_COMMAND(commandId, 'Loading url');

                // We need to check if the url is in the same domain, otherwise we need to open it in a new tab
                // TODO: We should add another option to a link command to define its target
                if (action.indexOf('http') === 0 && action.indexOf(document.location.origin) !== 0) {
                    window.open(action, '_blank', 'noopener,noreferrer')?.focus();
                } else {
                    window.location.href = action;
                }
                actions.FINISH_COMMAND();
                return;
            }

            // If the command is a function, execute it
            actions.EXECUTE_COMMAND(commandId, 'Running command');
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
        },
        [state.searchWord, state.commands, state.result?.options]
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
