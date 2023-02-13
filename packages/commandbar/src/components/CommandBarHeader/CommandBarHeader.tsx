import React from 'react';

import { useCommandBarState } from '../../state';
import Icon from '../Icon/Icon';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';
import { STATUS } from '../../state/commandBarMachine';

const CommandBarHeader: React.FC = () => {
    const {
        state: { selectedCommandGroup, status },
        actions,
    } = useCommandBarState();

    return (
        <header className={styles.commandBarHeader}>
            {(status == STATUS.DISPLAYING_RESULT || selectedCommandGroup) && (
                <button
                    type="button"
                    onClick={status == STATUS.DISPLAYING_RESULT ? actions.CANCEL : actions.GO_TO_PARENT_GROUP}
                    className={styles.backButton}
                    title="Back"
                >
                    <Icon icon="arrow-left" />
                </button>
            )}
            <SearchBox />
        </header>
    );
};

export default CommandBarHeader;
