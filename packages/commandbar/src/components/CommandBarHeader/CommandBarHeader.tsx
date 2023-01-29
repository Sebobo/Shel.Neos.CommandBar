import React from 'react';

import Icon from '../Icon/Icon';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';

type CommandBarHeaderProps = {
    selectedCommandGroup: CommandId;
    searchWord: string;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleBack: () => void;
    disabled?: boolean;
};

const CommandBarHeader: React.FC<CommandBarHeaderProps> = ({
    selectedCommandGroup,
    searchWord,
    handleBack,
    handleSearch,
    disabled = false,
}) => {
    return (
        <header className={styles.commandBarHeader}>
            {selectedCommandGroup && (
                <button type="button" onClick={handleBack} className={styles.backButton}>
                    <Icon icon="arrow-left" />
                </button>
            )}
            <SearchBox searchWord={searchWord} onChange={handleSearch} disabled={disabled} />
        </header>
    );
};

export default CommandBarHeader;
