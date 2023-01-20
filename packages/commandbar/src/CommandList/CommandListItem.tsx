import React, { useCallback } from 'react';

import * as styles from './CommandListItem.module.css';
import Icon from '../Presentationals/Icon';

type CommandListItemProps = {
    command: ProcessedCommandItem;
    onItemSelect: (commandId: CommandId) => void;
    highlighted: boolean;
    ref?: React.Ref<HTMLLIElement>;
    runningCommandId: CommandId;
};

const CommandListItem: React.FC<CommandListItemProps> = React.forwardRef(
    ({ command, onItemSelect, highlighted, runningCommandId }, ref) => {
        const { id, name, description, icon } = command;

        const handleSelect = useCallback(() => {
            onItemSelect(id);
        }, [id]);

        return (
            <li
                className={[styles.commandListItem, highlighted && styles.highlighted].join(' ')}
                onClick={handleSelect}
                ref={ref}
            >
                <Icon icon={icon} />
                <span className={styles.label}>
                    <span>{name}</span>
                    {description && <small>{typeof description == 'string' ? description : description()}</small>}
                </span>
            </li>
        );
    }
);
CommandListItem.displayName = 'CommandListItem';

// Update component when the command, highlight or last executed command changes to allow a refresh of the commands properties
export default React.memo(CommandListItem, (prev, next) => {
    return (
        prev.command.id === next.command.id && prev.ref === next.ref && prev.runningCommandId === next.runningCommandId
    );
});
