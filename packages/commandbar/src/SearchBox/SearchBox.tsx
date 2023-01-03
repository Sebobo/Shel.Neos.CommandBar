import * as React from 'react';

type SearchBoxProps = {
    searchWord: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onKeyUp: (e: React.KeyboardEvent<HTMLInputElement>) => void;
};

const SearchBox: React.FC<SearchBoxProps> = ({ searchWord, onChange, onKeyUp }) => {
    return (
        <input
            type="search"
            placeholder="Search for commands…"
            autoFocus={true}
            onChange={onChange}
            onKeyUp={onKeyUp}
            value={searchWord}
        />
    );
};

export default SearchBox;
