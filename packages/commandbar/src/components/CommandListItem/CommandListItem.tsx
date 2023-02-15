import React, { LegacyRef } from 'react';

import * as styles from './CommandListItem.module.css';

type CommandListItemProps = {
    command: ProcessedCommandItem;
    onItemSelect: (commandId: CommandId) => void;
    highlighted: boolean;
    highlightRef?: React.Ref<HTMLLIElement>;
    runningCommandId?: CommandId;
    disabled?: boolean;
    Icon: React.FC<IconProps>;
};

function getCommandType({ subCommandIds, category, canHandleQueries, action }: ProcessedCommandItem): string {
    if (subCommandIds?.length > 0) {
        return 'category';
    }

    if (category) {
        return category;
    }

    if (canHandleQueries) {
        return 'query';
    }

    if (typeof action == 'string') {
        return 'link';
    }

    return 'command';
}

const CommandListItem: React.FC<CommandListItemProps> = React.forwardRef(
    ({ command, onItemSelect, highlighted, disabled, Icon }, highlightRef: LegacyRef<HTMLLIElement>) => {
        const { id, name, description, icon } = command;

        const commandType = getCommandType(command);

        return (
            <li
                className={[
                    styles.commandListItem,
                    highlighted && styles.highlighted,
                    disabled && styles.disabled,
                ].join(' ')}
                onClick={disabled ? null : () => onItemSelect(id)}
                ref={highlightRef}
            >
                <Icon icon={icon} />
                <span className={styles.label}>
                    <span>{name}</span>
                    {description && (
                        <span className={styles.description}>
                            {typeof description == 'string' ? description : description()}
                        </span>
                    )}
                </span>
                <small className={styles.type}>{commandType}</small>
            </li>
        );
    }
);
CommandListItem.displayName = 'CommandListItem';

// Update component when the command, highlight or last executed command changes to allow a refresh of the commands properties
export default React.memo(CommandListItem, (prev, next) => {
    return (
        prev.command.id === next.command.id &&
        prev.highlightRef === next.highlightRef &&
        prev.runningCommandId === next.runningCommandId &&
        prev.disabled === next.disabled
    );
});
