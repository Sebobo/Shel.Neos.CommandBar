import React from 'react';

import { ACTIONS } from '../state/commandBarReducer';
import Icon from '../Presentationals/Icon';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';

type CommandBarHeaderProps = {
    selectedCommandGroup: CommandId;
    searchWord: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    dispatch: React.Dispatch<CommandBarAction>;
};

const CommandBarHeader: React.FC<CommandBarHeaderProps> = ({
    selectedCommandGroup,
    searchWord,
    dispatch,
    handleSearch,
}) => {
    return (
        <header className={styles.commandBarHeader}>
            {selectedCommandGroup && (
                <button
                    type="button"
                    onClick={() => dispatch({ type: ACTIONS.GO_TO_PARENT_GROUP })}
                    className={styles.backButton}
                >
                    <Icon icon="arrow-left" />
                </button>
            )}
            <SearchBox searchWord={searchWord} onChange={handleSearch} />
        </header>
    );
};

export default CommandBarHeader;
