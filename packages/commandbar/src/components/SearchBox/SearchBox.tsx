import React, { useCallback, useRef } from 'react';
import { useSignalEffect } from '@preact/signals';

import { useCommandBarState, STATUS, useIntl, useCommandExecutor } from '../../state';
import IconWrapper from '../IconWrapper/IconWrapper';

import * as styles from './SearchBox.module.css';
import { IconPlay } from '../Icons';

// Timer helper for debouncing updates of command query results
let updateResultsTimer = null;
const RESULT_UPDATE_DEBOUNCE_TIME = 500;

const SearchBox: React.FC = () => {
    const { state, actions } = useCommandBarState();
    const { executeCommand } = useCommandExecutor();
    const { translate } = useIntl();
    const inputRef = useRef<HTMLInputElement>();

    const handleChange = useCallback((e) => {
        if (state.status.value === STATUS.DISPLAYING_RESULT) {
            actions.UPDATE_COMMAND_QUERY(e.target.value);

            // Execute command after a delay if it's not a manual command
            if (!state.commands.value[state.resultCommandId.value].executeManually) {
                if (updateResultsTimer) {
                    clearTimeout(updateResultsTimer);
                }
                updateResultsTimer = setTimeout(
                    () => executeCommand(state.resultCommandId.value),
                    RESULT_UPDATE_DEBOUNCE_TIME
                );
            }
        } else {
            actions.UPDATE_SEARCH(e.target.value);
        }
    }, []);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            // Prevent escape event from bubbling up if the input is focused and the native reset should be used
            if (e.key === 'Escape') {
                if (inputRef.current.value) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }
        },
        [inputRef.current]
    );

    // Focus input when the command bar is ready for input
    useSignalEffect(() => {
        if (state.status.value !== STATUS.EXECUTING_COMMAND) {
            inputRef.current?.focus();
        }
    });

    console.debug('SearchBox.render', state.commands.value[state.resultCommandId.value]);

    return (
        <>
            <input
                ref={inputRef}
                className={styles.searchBox}
                type="search"
                placeholder={
                    state.status.value === STATUS.DISPLAYING_RESULT
                        ? translate('SearchBox.commandQuery.placeholder', 'Enter the query for the command')
                        : translate('SearchBox.placeholder', 'What do you want to do today?')
                }
                autoFocus
                onChange={handleChange}
                onKeyUp={handleKeyPress}
                value={
                    (state.status.value === STATUS.DISPLAYING_RESULT
                        ? state.commandQuery
                        : state.searchWord) as unknown as string
                }
                data-testid="SearchBox"
            />
            {!state.expanded.value && (
                <button
                    className={styles.expandButton}
                    onClick={actions.EXPAND}
                    title={translate('SearchBox.expand.title', 'Expand to show all commands')}
                >
                    <IconWrapper>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                            <path
                                fill="currentColor"
                                d="M31.3 192h257.3c17.8 0 26.7 21.5 14.1 34.1L174.1 354.8c-7.8 7.8-20.5 7.8-28.3 0L17.2 226.1C4.6 213.5 13.5 192 31.3 192z"
                            />
                        </svg>
                    </IconWrapper>
                </button>
            )}
            {state.status.value === STATUS.DISPLAYING_RESULT &&
                state.commands.value[state.resultCommandId.value]?.executeManually && (
                    <button
                        className={styles.executeButton}
                        onClick={() => executeCommand(state.resultCommandId.value)}
                        title={translate('SearchBox.execute.title', 'Execute the command')}
                    >
                        <IconWrapper>
                            <IconPlay />
                        </IconWrapper>
                    </button>
                )}
        </>
    );
};

export default React.memo(SearchBox);
