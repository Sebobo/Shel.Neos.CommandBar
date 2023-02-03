import React, { CSSProperties, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import * as styles from './CommandBar.module.css';
import { ACTIONS, commandBarReducer } from './state/commandBarReducer';
import { CommandBarFooter, CommandBarHeader, CommandList, CommandResultsView } from './components';
import { clamp, flattenCommands, logger } from './helpers';
import useFunctionRef from './hooks/useFunctionRef';

type CommandBarProps = {
    commands: HierarchicalCommandList;
    open: boolean;
    toggleOpen: () => void;
    onDrag?: (state: boolean) => void;
};

const CommandBar: React.FC<CommandBarProps> = ({ commands, open, toggleOpen, onDrag }) => {
    const [state, dispatch] = useReducer(commandBarReducer, {
        status: 'loading',
        expanded: false,
        selectedCommandGroup: null,
        searchWord: '',
        highlightedItem: 0,
        runningCommandId: null,
        runningCommandMessage: null,
        result: null,
        highlightedResultItem: 0,
        commands: flattenCommands(commands),
        availableCommandIds: Object.keys(commands),
    });
    const dialogRef = useRef<HTMLDialogElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragState, setDragState] = useState<{
        left: string | number;
        top: string | number;
        offsetLeft: number;
        offsetTop: number;
    }>({
        left: '50%',
        top: '50%',
        offsetLeft: 0,
        offsetTop: 0,
    });

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
                dispatch({ type: ACTIONS.RUN_COMMAND, commandId, argument: 'Loading url' });
                window.location.href = action;
                return;
            }
            dispatch({ type: ACTIONS.RUN_COMMAND, commandId, argument: 'Running command' });
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
                        dispatch({ type: ACTIONS.FINISH_COMMAND });
                    });
            } else if ((actionResult as CommandGeneratorResult).next) {
                // Handle generators
                const generator = actionResult as CommandGeneratorResult;
                // TODO: Handle errors / success === false
                for await (const result of generator) {
                    dispatch({ type: ACTIONS.RUN_COMMAND, commandId, argument: result.message });
                    if (result.options) {
                        dispatch({ type: ACTIONS.SHOW_RESULT, result });
                    }
                }
                dispatch({ type: ACTIONS.FINISH_COMMAND });
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

    const handleDragStart = useCallback(
        (e) => {
            if (e.target.tagName === 'INPUT') {
                logger.debug('Drag ignored because input is focused');
                return;
            }
            e.dataTransfer.setData('text/plain', 'CommandBar');
            e.dataTransfer.dropEffect = 'move';
            e.dataTransfer.effectAllowed = 'move';
            logger.debug('Drag started with offset');
            setDragState({
                left: e.clientX,
                top: e.clientY,
                offsetLeft: dialogRef.current.offsetLeft - e.clientX,
                offsetTop: dialogRef.current.offsetTop - e.clientY,
            });
            onDrag && onDrag(true);
        },
        [dialogRef.current]
    );

    const handleDragEnd = useCallback(
        (e) => {
            const { clientX, clientY } = e;
            setIsDragging(false);
            setDragState((prev) => ({
                ...prev,
                left: clamp(clientX, 0, window.innerWidth - (dialogRef.current.offsetWidth / 2 + prev.offsetLeft)),
                top: clamp(clientY, 0, window.innerHeight - (dialogRef.current.offsetHeight / 2 + prev.offsetTop)),
            }));
            logger.debug('Drag ended', window.innerWidth, dialogRef.current.offsetWidth, clientX, clientY);
            onDrag && onDrag(false);
        },
        [dialogRef.current]
    );

    const dialogStyle = useMemo(() => {
        const { left, top, offsetLeft, offsetTop } = dragState;
        return {
            left: typeof left == 'string' ? left : left + offsetLeft + 'px',
            top: typeof top == 'string' ? top : top + offsetTop + 'px',
            visibility: isDragging ? 'hidden' : 'visible',
        } as CSSProperties;
    }, [dragState, isDragging, dialogRef.current]);

    if (!open) {
        return null;
    }

    return (
        <dialog
            ref={dialogRef}
            className={[styles.commandBar, state.result && styles.hasResults].join(' ')}
            open={open}
            draggable
            onDragStart={handleDragStart}
            onDrag={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            style={dialogStyle}
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
