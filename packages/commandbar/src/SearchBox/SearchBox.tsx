import * as React from 'react';

import * as styles from './SearchBox.module.css';

type SearchBoxProps = {
    searchWord: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const SearchBox: React.FC<SearchBoxProps> = ({ searchWord, onChange, onKeyUp }) => {
    return (
        <input
            className={styles.searchBox}
            type="search"
            placeholder="Search for commands…"
            autoFocus
            onChange={onChange}
            onKeyDown={onKeyUp}
            value={searchWord}
        />
    );
};

export default SearchBox;
