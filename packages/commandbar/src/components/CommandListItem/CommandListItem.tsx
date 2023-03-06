import React from 'react';
import { ReadonlySignal, useComputed } from '@preact/signals';

import { IconWrapper } from '../index';
import { classnames } from '../../helpers';
import { IconStar } from '../Icons';

import * as styles from './CommandListItem.module.css';
import { useCommandBarState } from '../../state';

type CommandListItemProps = {
    command: ProcessedCommandItem;
    onItemSelect: (commandId: CommandId) => void;
    highlightedId: ReadonlySignal<CommandId>;
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

function CommandListItem({ command, onItemSelect, highlightedId, onToggleFavourite }: CommandListItemProps) {
    const {
        state: { searchWord, favouriteCommands },
        Icon,
    } = useCommandBarState();
    const { id, name, description, icon, action, canHandleQueries } = command;
    const commandType = getCommandType(command);

    const isHighlighted = useComputed(() => highlightedId.value === id);
    const isDisabled = useComputed(() => !searchWord.value && canHandleQueries);
    const isFavourite = useComputed(() => favouriteCommands.value.includes(id));

    return (
        <li
            className={classnames(
                styles.commandListItem,
                isHighlighted.value && styles.highlighted,
                isDisabled.value && styles.disabled
            )}
            onClick={isDisabled.value ? null : () => onItemSelect(id)}
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
                    className={classnames(styles.favouriteButton, isFavourite.value && styles.isFavourite)}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavourite(id);
                    }}
                >
                    <IconWrapper>
                        <IconStar />
                    </IconWrapper>
                </button>
            )}
            <small className={styles.type}>{commandType}</small>
        </li>
    );
}

// Use memo to prevent rerendering of all items when the parent list is updated
export default React.memo(CommandListItem);
