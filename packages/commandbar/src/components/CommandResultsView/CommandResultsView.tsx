import React, { useCallback } from 'react';

import * as styles from './CommandResultsView.module.css';
import CommandListing from '../CommandList/CommandList';

type CommandResultsViewProps = {
    result: CommandResult;
    highlightedItem: number;
};

const CommandResultsView: React.FC<CommandResultsViewProps> = ({ result, highlightedItem }) => {
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
                    highlightedItem={highlightedItem}
                    handleSelectItem={handleSelectItem}
                    noCommandsMessage="Try a different query to find more results"
                />
            )}
        </div>
    );
};

export default React.memo(CommandResultsView);
