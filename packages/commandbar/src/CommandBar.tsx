import * as React from 'react';
import { useCallback, useEffect, useReducer } from 'react';

import * as styles from './CommandBar.module.css';
import CommandListItem from './CommandList/CommandListItem';
import { commandBarReducer, ACTIONS } from './state/commandBarReducer';
import CommandBarFooter from './CommandBarFooter/CommandBarFooter';
import CommandBarHeader from './CommandBarHeader/CommandBarHeader';
import CommandListing from './CommandList/CommandListing';

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
            if (!open) {
                return;
            }
            if (e.key === 'Escape') {
                if (state.selectedGroup || state.searchWord) {
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
            } else if (e.key === 'Enter' && state.availableCommandNames.length > 0) {
                const commandName = state.availableCommandNames[state.highlightedItem];
                const command = (state.selectedGroup ? state.selectedGroup.children : commands)[commandName];
                handleSelectItem(command);
                e.stopPropagation();
            }
        },
        [state.availableCommandNames, state.selectedGroup, state.highlightedItem, state.searchWord, open]
    );

    const handleSearch = useCallback((e) => {
        dispatch({ type: ACTIONS.UPDATE_SEARCH, searchWord: e.target.value.toLowerCase() });
    }, []);

    const handleSelectItem = useCallback(
        (command: CommandItem) => {
            if ((command as Command).action) {
                const { action, canHandleQueries } = command as Command;
                if (typeof action == 'string') {
                    window.location.href = action;
                } else {
                    // TODO: Add check if action is (safely) callable
                    action(canHandleQueries ? state.searchWord : undefined);
                }
            } else {
                dispatch({ type: ACTIONS.SELECT_GROUP, command: command as CommandGroup });
            }
        },
        [state.searchWord]
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
                selectedGroup={state.selectedGroup}
                searchWord={state.searchWord}
                dispatch={dispatch}
                handleSearch={handleSearch}
                handleKeyEntered={handleKeyEntered}
            />
            <div className={[styles.resultsWrap, state.expanded && styles.expanded].join(' ')}>
                <CommandListing
                    commands={state.commands}
                    availableCommandNames={state.availableCommandNames}
                    selectedGroup={state.selectedGroup}
                    highlightedItem={state.highlightedItem}
                    handleSelectItem={handleSelectItem}
                />
            </div>
            {state.expanded && <CommandBarFooter selectedGroup={state.selectedGroup} />}
        </dialog>
    );
};

export default CommandBar;
