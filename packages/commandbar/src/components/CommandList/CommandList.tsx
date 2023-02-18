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
        state: { commands, highlightedItem, availableCommandIds, activeCommandId, status, searchWord, favourites },
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
            if (favourites.includes(commandId)) {
                REMOVE_FAVOURITE(commandId);
            } else {
                ADD_FAVOURITE(commandId);
            }
        },
        [favourites]
    );

    return (
        <nav className={classnames(styles.results, status !== STATUS.IDLE && styles.disabled)}>
            {heading && <h6>{heading}</h6>}
            {availableCommandIds.length > 0 ? (
                <ul>
                    {availableCommandIds.map((commandId, index) => (
                        <CommandListItem
                            key={commandId}
                            Icon={Icon}
                            highlightRef={highlightedItem === index ? selectedElementRef : null}
                            command={commands[commandId]}
                            onItemSelect={executeCommand}
                            highlighted={highlightedItem === index}
                            runningCommandId={activeCommandId}
                            disabled={!searchWord && commands[commandId].canHandleQueries}
                            isFavourite={favourites.includes(commandId)}
                            onToggleFavourite={handleToggleFavourite}
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
