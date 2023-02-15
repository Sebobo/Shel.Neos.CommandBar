import React, { useEffect } from 'react';

import CommandListItem from '../CommandListItem/CommandListItem';
import { useCommandBarState, useCommandInput } from '../../state';

import * as styles from './CommandListing.module.css';
import { STATUS } from '../../state/commandBarMachine';

type CommandListingProps = {
    heading?: string;
    noCommandsMessage?: string;
};

const CommandList: React.FC<CommandListingProps> = ({
    heading = 'Commands',
    noCommandsMessage = 'No matching commands found',
}) => {
    const {
        state: { commands, highlightedItem, availableCommandIds, activeCommandId, status, searchWord },
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const selectedElementRef = React.useRef(null);

    useEffect(() => {
        selectedElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedElementRef.current]);

    return (
        <nav className={[styles.results, status !== STATUS.IDLE && styles.disabled].join(' ')}>
            {heading && <h6>{heading}</h6>}
            {availableCommandIds.length > 0 ? (
                <ul>
                    {availableCommandIds.map((commandId, index) => (
                        <CommandListItem
                            key={commandId}
                            highlightRef={highlightedItem === index ? selectedElementRef : null}
                            command={commands[commandId]}
                            onItemSelect={executeCommand}
                            highlighted={highlightedItem === index}
                            runningCommandId={activeCommandId}
                            disabled={!searchWord && commands[commandId].canHandleQueries}
                        />
                    ))}
                </ul>
            ) : (
                <small className={styles.noResults}>{noCommandsMessage}</small>
            )}
        </nav>
    );
};

export default React.memo(CommandList);
