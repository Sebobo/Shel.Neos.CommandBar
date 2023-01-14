import * as React from 'react';
import { useEffect } from 'react';

import * as styles from './CommandListing.module.css';
import CommandListItem from './CommandListItem';

type CommandListingProps = {
    commands: FlatCommandList;
    availableCommandIds: CommandId[];
    highlightedItem: number;
    handleSelectItem: (commandId: CommandId) => void;
};

const CommandListing: React.FC<CommandListingProps> = ({
    commands,
    availableCommandIds,
    highlightedItem,
    handleSelectItem,
}) => {
    const selectedElementRef = React.useRef(null);

    useEffect(() => {
        selectedElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedElementRef.current]);

    return (
        <nav className={styles.results}>
            <h6>Commands</h6>
            {availableCommandIds.length > 0 ? (
                <ul>
                    {availableCommandIds.map((commandId, index) => (
                        <CommandListItem
                            key={commandId}
                            ref={highlightedItem === index ? selectedElementRef : null}
                            command={commands[commandId]}
                            onItemSelect={handleSelectItem}
                            highlighted={highlightedItem === index}
                        />
                    ))}
                </ul>
            ) : (
                <small className={styles.noResults}>No matching commands found</small>
            )}
        </nav>
    );
};

export default React.memo(CommandListing);
