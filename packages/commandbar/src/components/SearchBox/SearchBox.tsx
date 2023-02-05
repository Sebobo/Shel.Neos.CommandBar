import React, { useCallback, useEffect, useRef } from 'react';

import { useCommandBarState } from '../../state';
import { STATUS } from '../../state/commandBarMachine';

import * as styles from './SearchBox.module.css';

const SearchBox: React.FC = () => {
    const {
        state: { searchWord, status },
        actions,
    } = useCommandBarState();
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
        <input
            ref={inputRef}
            className={styles.searchBox}
            type="search"
            placeholder="Search for commands…"
            autoFocus
            onChange={handleChange}
            onKeyUp={handleKeyPress}
            value={searchWord}
            disabled={status !== STATUS.IDLE && status !== STATUS.COLLAPSED}
        />
    );
};

export default SearchBox;
