import * as React from 'react';
import { useCallback, useEffect, useReducer } from 'react';

import * as styles from './CommandBar.module.css';
import CommandListItem from './CommandList/CommandListItem';
import { commandBarReducer, ACTIONS } from './state/commandBarReducer';
import CommandBarFooter from './CommandBarFooter/CommandBarFooter';
import CommandBarHeader from './CommandBarHeader/CommandBarHeader';

type CommandBarProps = {
    commands: CommandList;
    open: boolean;
    toggleOpen: () => void;
};

const initialState: CommandBarState = {
    expanded: false,
    selectedGroup: null,
    searchWord: '',
    highlightedItem: 0,
    commands: {},
    availableCommandNames: [],
};

const CommandBar: React.FC<CommandBarProps> = ({ commands, open, toggleOpen }) => {
    const [state, dispatch] = useReducer(commandBarReducer, {
        ...initialState,
        commands,
        availableCommandNames: Object.keys(commands),
    });

    const handleKeyEntered = useCallback(
        (e: KeyboardEvent | React.KeyboardEvent<HTMLInputElement>) => {
            console.log('event', e);
            if (e.key === 'Escape') {
                dispatch({ type: ACTIONS.CANCEL });
                e.preventDefault();
            } else if (e.key === 'ArrowDown') {
                dispatch({ type: ACTIONS.HIGHLIGHT_NEXT_ITEM });
                e.stopPropagation();
            } else if (e.key === 'ArrowUp') {
                dispatch({ type: ACTIONS.HIGHLIGHT_PREVIOUS_ITEM });
                e.stopPropagation();
            } else if (e.key === 'Enter' && state.availableCommandNames.length > 0) {
                const commandName = state.availableCommandNames[state.highlightedItem];
                const command = (state.selectedGroup ? state.selectedGroup.children : commands)[commandName];
                console.debug(commandName, state.availableCommandNames, state.selectedGroup, 'entering');
                handleSelectItem(command);
                e.stopPropagation();
            }
        },
        [state.availableCommandNames, state.selectedGroup, state.highlightedItem]
    );

    const handleSearch = useCallback((e) => {
        dispatch({ type: ACTIONS.UPDATE_SEARCH, searchWord: e.target.value.toLowerCase() });
    }, []);

    const handleSelectItem = useCallback((command: CommandItem) => {
        if ((command as Command).action) {
            const { action } = command as Command;
            if (typeof action == 'string') {
                window.location.href = action;
            } else {
                // TODO: Add check if action is (safely) callable
                (action as () => void)();
            }
        } else {
            dispatch({ type: ACTIONS.SELECT_GROUP, command: command as CommandGroup });
        }
    }, []);

    useEffect(() => {
        console.debug('Setting up event listener');
        document.addEventListener('keypress', handleKeyEntered, true);
        return () => {
            document.removeEventListener('keypress', handleKeyEntered, true);
        };
    }, []);

    if (!open) {
        return null;
    }

    return (
        <dialog className={styles.commandBar} open={open}>
            <CommandBarHeader
                state={state}
                dispatch={dispatch}
                handleSearch={handleSearch}
                handleKeyEntered={handleKeyEntered}
            />
            <div className={[styles.resultsWrap, state.expanded && styles.expanded].join(' ')}>
                <nav className={styles.results}>
                    <h6>Commands</h6>
                    {state.availableCommandNames.length > 0 ? (
                        <ul>
                            {state.availableCommandNames.map((commandName, index) => (
                                <CommandListItem
                                    key={commandName}
                                    command={
                                        (state.selectedGroup ? state.selectedGroup.children : commands)[commandName]
                                    }
                                    onItemSelect={handleSelectItem}
                                    highlighted={state.highlightedItem === index}
                                />
                            ))}
                        </ul>
                    ) : (
                        <small className={styles.noResults}>No matching commands found</small>
                    )}
                </nav>
            </div>
            {state.expanded && <CommandBarFooter state={state} />}
        </dialog>
    );
};

export default CommandBar;
