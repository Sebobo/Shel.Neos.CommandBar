import React, { useEffect } from 'react';

import CommandListItem from '../CommandListItem/CommandListItem';
import { useCommandInput, useCommandBarState } from '../../state';

import * as styles from './CommandListing.module.css';

type CommandListingProps = {
    heading?: string;
    noCommandsMessage?: string;
};

const CommandList: React.FC<CommandListingProps> = ({
    heading = 'Commands',
    noCommandsMessage = 'No matching commands found',
}) => {
    const {
        state: { commands, highlightedItem, availableCommandIds, runningCommandId, result },
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const selectedElementRef = React.useRef(null);

    useEffect(() => {
        selectedElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedElementRef.current]);

    return (
        <nav className={[styles.results, !!result && styles.disabled].join(' ')}>
            {heading && <h6>{heading}</h6>}
            {availableCommandIds.length > 0 ? (
                <ul>
                    {availableCommandIds.map((commandId, index) => (
                        <CommandListItem
                            key={commandId}
                            ref={highlightedItem === index ? selectedElementRef : null}
                            command={commands[commandId]}
                            onItemSelect={executeCommand}
                            highlighted={highlightedItem === index}
                            runningCommandId={runningCommandId}
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
