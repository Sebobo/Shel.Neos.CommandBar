import * as React from 'react';

import * as styles from './SearchBox.module.css';
import { useCallback, useRef } from 'react';

type SearchBoxProps = {
    searchWord: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const SearchBox: React.FC<SearchBoxProps> = ({ searchWord, onChange }) => {
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

    return (
        <input
            ref={inputRef}
            className={styles.searchBox}
            type="search"
            placeholder="Search for commands…"
            autoFocus
            onChange={onChange}
            onKeyUp={handleKeyPress}
            value={searchWord}
        />
    );
};

export default SearchBox;
