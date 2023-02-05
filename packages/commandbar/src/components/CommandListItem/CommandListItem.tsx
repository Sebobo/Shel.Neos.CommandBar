import React from 'react';

import * as styles from './CommandListItem.module.css';
import Icon from '../Icon/Icon';

type CommandListItemProps = {
    command: ProcessedCommandItem;
    onItemSelect: (commandId: CommandId) => void;
    highlighted: boolean;
    ref?: React.Ref<HTMLLIElement>;
    runningCommandId?: CommandId;
    disabled?: boolean;
};

const CommandListItem: React.FC<CommandListItemProps> = React.forwardRef(
    ({ command, onItemSelect, highlighted, runningCommandId, disabled }, ref) => {
        const { id, name, description, icon, subCommandIds, canHandleQueries } = command;

        const commandType = subCommandIds?.length > 0 ? 'category' : canHandleQueries ? 'query' : 'command';

        return (
            <li
                className={[
                    styles.commandListItem,
                    highlighted && styles.highlighted,
                    disabled && styles.disabled,
                ].join(' ')}
                onClick={disabled ? null : () => onItemSelect(id)}
                ref={ref}
            >
                <Icon icon={icon} />
                <span className={styles.label}>
                    <span>{name}</span>
                    {description && <small>{typeof description == 'string' ? description : description()}</small>}
                </span>
                <small>{commandType}</small>
            </li>
        );
    }
);
CommandListItem.displayName = 'CommandListItem';

// Update component when the command, highlight or last executed command changes to allow a refresh of the commands properties
export default React.memo(CommandListItem, (prev, next) => {
    return (
        prev.command.id === next.command.id &&
        prev.ref === next.ref &&
        prev.runningCommandId === next.runningCommandId &&
        prev.disabled === next.disabled
    );
});
