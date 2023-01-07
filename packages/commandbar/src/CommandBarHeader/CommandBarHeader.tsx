import * as React from 'react';

import { ACTIONS } from '../state/commandBarReducer';
import Icon from '../Presentationals/Icon';
import SearchBox from '../SearchBox/SearchBox';

import * as styles from './CommandBarHeader.module.css';

type CommandBarHeaderProps = {
    state: CommandBarState;
    handleSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleKeyEntered: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    dispatch: React.Dispatch<CommandBarAction>;
};

const CommandBarHeader: React.FC<CommandBarHeaderProps> = ({ state, dispatch, handleKeyEntered, handleSearch }) => {
    return (
        <header className={styles.commandBarHeader}>
            {state.selectedGroup && (
                <button
                    type="button"
                    onClick={() => dispatch({ type: ACTIONS.GO_TO_PARENT_GROUP })}
                    className={styles.backButton}
                >
                    <Icon icon="arrow-left" />
                </button>
            )}
            <SearchBox searchWord={state.searchWord} onChange={handleSearch} onKeyUp={handleKeyEntered} />
        </header>
    );
};

export default CommandBarHeader;
