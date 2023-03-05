import React, { useCallback } from 'react';
import { useComputed, useSignalEffect } from '@preact/signals';

import CommandListItem from '../CommandListItem/CommandListItem';
import { useCommandBarState, useCommandInput, STATUS } from '../../state';
import { classnames } from '../../helpers';

import * as styles from './CommandListing.module.css';

const CommandList: React.FC = () => {
    const {
        state: {
            commands,
            highlightedItem,
            availableCommandIds,
            status,
            searchWord,
            favouriteCommands,
            recentCommands,
        },
        actions: { ADD_FAVOURITE, REMOVE_FAVOURITE },
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const navRef = React.useRef<HTMLElement>(null);

    useSignalEffect(() => {
        navRef.current
            ?.querySelector(`li:nth-child(${highlightedItem})`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const handleToggleFavourite = useCallback(
        (commandId: CommandId) => {
            if (favouriteCommands.value.includes(commandId)) {
                REMOVE_FAVOURITE(commandId);
            } else {
                ADD_FAVOURITE(commandId);
            }
        },
        [favouriteCommands]
    );

    const suggestions = useComputed(() => {
        return searchWord.value
            ? []
            : availableCommandIds.value.filter((commandId) => recentCommands.value.includes(commandId));
    });
    const availableCommands = useComputed(() => {
        return searchWord.value
            ? availableCommandIds.value
            : availableCommandIds.value.filter((commandId) => !recentCommands.value.includes(commandId));
    });
    const highlightedCommand = useComputed<CommandId>(() => availableCommandIds.value[highlightedItem.value]);

    return (
        <nav
            className={classnames(styles.results, status.value !== STATUS.IDLE && styles.disabled)}
            data-testid="CommandList"
            ref={navRef}
        >
            {suggestions.value.length > 0 && (
                <>
                    <h6>Recently used</h6>
                    <ul>
                        {suggestions.value.map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                command={commands.value[commandId]}
                                onItemSelect={executeCommand}
                                highlightedId={highlightedCommand}
                                onToggleFavourite={handleToggleFavourite}
                            />
                        ))}
                    </ul>
                </>
            )}
            {availableCommands.value.length > 0 && (
                <>
                    <h6>Commands</h6>
                    <ul>
                        {availableCommands.value.map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                command={commands.value[commandId]}
                                onItemSelect={executeCommand}
                                highlightedId={highlightedCommand}
                                onToggleFavourite={handleToggleFavourite}
                            />
                        ))}
                    </ul>
                </>
            )}
            {availableCommandIds.value.length === 0 && (
                <small className={styles.noResults}>No matching commands found</small>
            )}
        </nav>
    );
};

export default React.memo(CommandList);
