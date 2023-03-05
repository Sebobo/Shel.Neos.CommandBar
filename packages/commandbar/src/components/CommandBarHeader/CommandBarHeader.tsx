import React from 'react';
import { useComputed } from '@preact/signals';

import { useCommandBarState, STATUS } from '../../state';
import IconWrapper from '../IconWrapper/IconWrapper';
import SearchBox from '../SearchBox/SearchBox';
import { IconBack } from '../Icons';

import * as styles from './CommandBarHeader.module.css';

const CommandBarHeader: React.FC = () => {
    const { state, actions } = useCommandBarState();
    const isDisplayingResults = useComputed(() => state.status.value == STATUS.DISPLAYING_RESULT);

    return (
        <header className={styles.commandBarHeader}>
            {(isDisplayingResults.value || state.selectedCommandGroup.value) && (
                <button
                    type="button"
                    onClick={isDisplayingResults.value ? actions.CANCEL : actions.GO_TO_PARENT_GROUP}
                    className={styles.backButton}
                    title="Back"
                >
                    <IconWrapper>
                        <IconBack />
                    </IconWrapper>
                </button>
            )}
            <SearchBox />
        </header>
    );
};

export default React.memo(CommandBarHeader);
