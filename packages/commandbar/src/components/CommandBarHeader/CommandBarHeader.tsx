import React from 'react';

import { useCommandBarState } from '../../state';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';
import { STATUS } from '../../state/commandBarMachine';
import IconWrapper from '../IconWrapper/IconWrapper';

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
                    <IconWrapper>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                            <path
                                fill="currentColor"
                                d="m257.5 445.1-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z"
                            />
                        </svg>
                    </IconWrapper>
                </button>
            )}
            <SearchBox />
        </header>
    );
};

export default CommandBarHeader;
