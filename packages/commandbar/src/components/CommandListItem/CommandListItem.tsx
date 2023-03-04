import React from 'react';

import { IconWrapper } from '../index';
import { classnames } from '../../helpers';

import * as styles from './CommandListItem.module.css';

type CommandListItemProps = {
    command: ProcessedCommandItem;
    onItemSelect: (commandId: CommandId) => void;
    highlighted: boolean;
    runningCommandId?: CommandId;
    disabled?: boolean;
    Icon: React.FC<IconProps>;
    isFavourite?: boolean;
    onToggleFavourite?: (id: CommandId) => void;
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

const CommandListItem: React.FC<CommandListItemProps> = ({
    command,
    onItemSelect,
    highlighted,
    disabled,
    Icon,
    isFavourite,
    onToggleFavourite,
}) => {
    const { id, name, description, icon, action } = command;

    const commandType = getCommandType(command);

    return (
        <li
            className={classnames(
                styles.commandListItem,
                highlighted && styles.highlighted,
                disabled && styles.disabled
            )}
            onClick={disabled ? null : () => onItemSelect(id)}
            data-testid="CommandListItem"
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
            {onToggleFavourite && action && (
                <button
                    type="button"
                    className={classnames(styles.favouriteButton, isFavourite && styles.isFavourite)}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavourite(id);
                    }}
                >
                    <IconWrapper>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512">
                            <path
                                fill="currentColor"
                                d="M528.1 171.5 382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6zM388.6 312.3l23.7 138.4L288 385.4l-124.3 65.3 23.7-138.4-100.6-98 139-20.2 62.2-126 62.2 126 139 20.2-100.6 98z"
                            />
                        </svg>
                    </IconWrapper>
                </button>
            )}
            <small className={styles.type}>{commandType}</small>
        </li>
    );
};
CommandListItem.displayName = 'CommandListItem';

// Update component when the command, highlight or last executed command changes to allow a refresh of the commands properties
export default React.memo(CommandListItem, (prev, next) => {
    return (
        prev.command.id === next.command.id &&
        prev.runningCommandId === next.runningCommandId &&
        prev.disabled === next.disabled &&
        prev.highlighted === next.highlighted &&
        prev.isFavourite === next.isFavourite
    );
});
