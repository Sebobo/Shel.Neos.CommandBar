import React, { useCallback, useEffect, useRef } from 'react';

import { useCommandBarState, STATUS, useIntl } from '../../state';
import IconWrapper from '../IconWrapper/IconWrapper';

import * as styles from './SearchBox.module.css';

const SearchBox: React.FC = () => {
    const {
        state: { searchWord, status, expanded },
        actions,
    } = useCommandBarState();
    const { translate } = useIntl();
    const inputRef = useRef<HTMLInputElement>();

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

    useEffect(() => {
        if (status === STATUS.IDLE) {
            inputRef.current?.focus();
        }
    }, [inputRef.current, status]);

    const handleChange = useCallback((e) => actions.UPDATE_SEARCH(e.target.value), []);

    return (
        <>
            <input
                ref={inputRef}
                className={styles.searchBox}
                type="search"
                placeholder={translate('SearchBox.placeholder', 'What do you want to do today?')}
                autoFocus
                onChange={handleChange}
                onKeyUp={handleKeyPress}
                value={searchWord}
                disabled={status !== STATUS.IDLE && status !== STATUS.COLLAPSED}
                data-testid="SearchBox"
            />
            {!expanded && (
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
        </>
    );
};

export default React.memo(SearchBox);
