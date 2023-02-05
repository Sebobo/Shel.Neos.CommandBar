import React from 'react';

import { useCommandBarState } from '../../state';
import Icon from '../Icon/Icon';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';

const CommandBarHeader: React.FC = () => {
    const {
        state: { selectedCommandGroup },
        actions,
    } = useCommandBarState();

    return (
        <header className={styles.commandBarHeader}>
            {selectedCommandGroup && (
                <button type="button" onClick={actions.GO_TO_PARENT_GROUP} className={styles.backButton}>
                    <Icon icon="arrow-left" />
                </button>
            )}
            <SearchBox />
        </header>
    );
};

export default CommandBarHeader;
