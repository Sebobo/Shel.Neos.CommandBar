import React, { useCallback } from 'react';

import * as styles from './CommandResultsView.module.css';
import CommandListing from '../CommandList/CommandListing';

type CommandResultsViewProps = {
    result: CommandResult;
};

const CommandResultsView: React.FC<CommandResultsViewProps> = ({ result }) => {
    const { options, view, message } = result;

    const handleSelectItem = useCallback(
        (commandId: CommandId) => {
            const { action } = options[commandId];
            if (!action) return;
            if (typeof action == 'string') {
                window.location.href = action;
                return;
            }
            console.debug('Running action result command', commandId);
            action();
        },
        [options]
    );

    return (
        <div className={styles.commandResultsView}>
            {view ? <div>{view}</div> : ''}
            {options && (
                <CommandListing
                    heading={message}
                    commands={options}
                    availableCommandIds={Object.keys(options)}
                    highlightedItem={0}
                    handleSelectItem={handleSelectItem}
                />
            )}
        </div>
    );
};

export default React.memo(CommandResultsView);
