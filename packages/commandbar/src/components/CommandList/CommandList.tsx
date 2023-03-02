import React, { useCallback, useEffect } from 'react';

import CommandListItem from '../CommandListItem/CommandListItem';
import { useCommandBarState, useCommandInput } from '../../state';

import * as styles from './CommandListing.module.css';
import { STATUS } from '../../state/commandBarMachine';
import { classnames } from '../../helpers';

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
    const selectedElementRef = React.useRef(null);

    useEffect(() => {
        selectedElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedElementRef.current]);

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

    const availableCommandIdsWithRecentlyUsed = availableCommandIds.filter(
        (commandId) => !recentCommands.includes(commandId)
    );

    return (
        <nav
            className={classnames(styles.results, status !== STATUS.IDLE && styles.disabled)}
            data-testid="CommandList"
        >
            {availableCommandIds.some((commandId) => recentCommands.includes(commandId)) && (
                <>
                    <h6>Suggestions</h6>
                    <ul>
                        {availableCommandIds
                            .filter((commandId) => recentCommands.includes(commandId))
                            .map((commandId) => (
                                <CommandListItem
                                    key={commandId}
                                    Icon={Icon}
                                    highlightRef={
                                        highlightedItem === availableCommandIds.indexOf(commandId)
                                            ? selectedElementRef
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
            {availableCommandIdsWithRecentlyUsed.length > 0 && (
                <>
                    {heading && <h6>{heading}</h6>}
                    <ul>
                        {availableCommandIdsWithRecentlyUsed.map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                Icon={Icon}
                                highlightRef={
                                    highlightedItem === availableCommandIds.indexOf(commandId)
                                        ? selectedElementRef
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
