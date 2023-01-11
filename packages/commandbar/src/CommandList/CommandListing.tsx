import * as React from 'react';
import { useEffect } from 'react';

import * as styles from './CommandListing.module.css';
import CommandListItem from './CommandListItem';

type CommandListingProps = {
    commands: CommandList;
    availableCommandNames: string[];
    highlightedItem: number;
    selectedGroup: CommandGroup | null;
    handleSelectItem: (command: CommandItem) => void;
};

const CommandListing: React.FC<CommandListingProps> = ({
    commands,
    availableCommandNames,
    highlightedItem,
    selectedGroup,
    handleSelectItem,
}) => {
    const selectedElementRef = React.useRef(null);

    useEffect(() => {
        selectedElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedElementRef.current]);

    return (
        <nav className={styles.results}>
            <h6>Commands</h6>
            {availableCommandNames.length > 0 ? (
                <ul>
                    {availableCommandNames.map((commandName, index) => (
                        <CommandListItem
                            key={commandName}
                            ref={highlightedItem === index ? selectedElementRef : null}
                            command={(selectedGroup ? selectedGroup.children : commands)[commandName]}
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
