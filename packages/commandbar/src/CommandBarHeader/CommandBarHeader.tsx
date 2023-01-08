import * as React from 'react';

import { ACTIONS } from '../state/commandBarReducer';
import Icon from '../Presentationals/Icon';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';

type CommandBarHeaderProps = {
    selectedGroup: CommandGroup;
    searchWord: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyEntered: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    dispatch: React.Dispatch<CommandBarAction>;
};

const CommandBarHeader: React.FC<CommandBarHeaderProps> = ({
    selectedGroup,
    searchWord,
    dispatch,
    handleKeyEntered,
    handleSearch,
}) => {
    return (
        <header className={styles.commandBarHeader}>
            {selectedGroup && (
                <button
                    type="button"
                    onClick={() => dispatch({ type: ACTIONS.GO_TO_PARENT_GROUP })}
                    className={styles.backButton}
                >
                    <Icon icon="arrow-left" />
                </button>
            )}
            <SearchBox searchWord={searchWord} onChange={handleSearch} onKeyUp={handleKeyEntered} />
        </header>
    );
};

export default CommandBarHeader;
