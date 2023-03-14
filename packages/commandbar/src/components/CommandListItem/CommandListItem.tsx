import React from 'react';
import { ReadonlySignal, useComputed } from '@preact/signals';

import { IconWrapper } from '../index';
import { classnames } from '../../helpers';
import { IconStar } from '../Icons';

import * as styles from './CommandListItem.module.css';
import { useCommandBarState, useIntl } from '../../state';

type CommandListItemProps = {
    command: ProcessedCommandItem;
    onItemSelect: (commandId: CommandId) => void;
    highlightedId: ReadonlySignal<CommandId>;
    onToggleFavourite?: (id: CommandId) => void;
};

function getCommandType(
    { subCommandIds, category, canHandleQueries, action }: ProcessedCommandItem,
    translate: TranslateFunction
): string {
    let type = 'command';
    if (category) {
        return category;
    } else if (subCommandIds?.length > 0) {
        type = 'category';
    } else if (canHandleQueries) {
        type = 'query';
    } else if (typeof action == 'string') {
        type = 'link';
    }

    return translate(`CommandListItem.type.${type}`, type);
}

function CommandListItem({ command, onItemSelect, highlightedId, onToggleFavourite }: CommandListItemProps) {
    const {
        state: { favouriteCommands },
        Icon,
    } = useCommandBarState();
    const { translate } = useIntl();
    const { id, name, description, icon, action } = command;
    const commandType = getCommandType(command, translate);

    const isHighlighted = useComputed(() => highlightedId.value === id);
    const isFavourite = useComputed(() => favouriteCommands.value.includes(id));

    return (
        <li
            className={classnames(styles.commandListItem, isHighlighted.value && styles.highlighted)}
            onClick={() => onItemSelect(id)}
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
                    title={translate('CommandListItem.toggleFavourite', 'Toggle favourite')}
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
