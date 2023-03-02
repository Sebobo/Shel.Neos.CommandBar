import React, { useCallback, useEffect } from 'react';

import CommandListItem from '../CommandListItem/CommandListItem';
import { useCommandBarState, useCommandInput } from '../../state';

import * as styles from './CommandListing.module.css';
import { STATUS } from '../../state/commandBarMachine';
import { classnames, logger } from '../../helpers';

type CommandListingProps = {
    heading?: string;
    noCommandsMessage?: string;
};

const CommandList: React.FC<CommandListingProps> = ({
    heading = 'Commands',
    noCommandsMessage = 'No matching commands found',
}) => {
    const {
        state: {
            commands,
            highlightedItem,
            availableCommandIds,
            activeCommandId,
            status,
            searchWord,
            favouriteCommands,
            recentCommands,
        },
        actions: { ADD_FAVOURITE, REMOVE_FAVOURITE },
        Icon,
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const highlightedCommandRef = React.useRef<HTMLLIElement>(null);

    useEffect(() => {
        highlightedCommandRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [highlightedCommandRef.current]);

    const handleToggleFavourite = useCallback(
        (commandId: CommandId) => {
            if (favouriteCommands.includes(commandId)) {
                REMOVE_FAVOURITE(commandId);
            } else {
                ADD_FAVOURITE(commandId);
            }
        },
        [favouriteCommands]
    );

    const suggestions = searchWord ? [] : availableCommandIds.filter((commandId) => recentCommands.includes(commandId));
    const availableCommands = searchWord
        ? availableCommandIds
        : availableCommandIds.filter((commandId) => !recentCommands.includes(commandId));

    return (
        <nav
            className={classnames(styles.results, status !== STATUS.IDLE && styles.disabled)}
            data-testid="CommandList"
        >
            {suggestions.length > 0 && (
                <>
                    <h6>Suggestions</h6>
                    <ul>
                        {suggestions.map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                Icon={Icon}
                                ref={
                                    highlightedItem === availableCommandIds.indexOf(commandId)
                                        ? highlightedCommandRef
                                        : null
                                }
                                command={commands[commandId]}
                                onItemSelect={executeCommand}
                                highlighted={highlightedItem === availableCommandIds.indexOf(commandId)}
                                runningCommandId={activeCommandId}
                                disabled={!searchWord && commands[commandId].canHandleQueries}
                                isFavourite={favouriteCommands.includes(commandId)}
                                onToggleFavourite={handleToggleFavourite}
                            />
                        ))}
                    </ul>
                </>
            )}
            {availableCommands.length > 0 && (
                <>
                    {heading && <h6>{heading}</h6>}
                    <ul>
                        {availableCommands.map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                Icon={Icon}
                                ref={
                                    highlightedItem === availableCommandIds.indexOf(commandId)
                                        ? highlightedCommandRef
                                        : null
                                }
                                command={commands[commandId]}
                                onItemSelect={executeCommand}
                                highlighted={highlightedItem === availableCommandIds.indexOf(commandId)}
                                runningCommandId={activeCommandId}
                                disabled={!searchWord && commands[commandId].canHandleQueries}
                                isFavourite={favouriteCommands.includes(commandId)}
                                onToggleFavourite={handleToggleFavourite}
                            />
                        ))}
                    </ul>
                </>
            )}
            {availableCommandIds.length === 0 && <small className={styles.noResults}>{noCommandsMessage}</small>}
        </nav>
    );
};

export default React.memo(CommandList);
