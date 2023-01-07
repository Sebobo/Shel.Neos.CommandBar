import React from 'react';

import * as styles from './CommandListItem.module.css';
import Icon from '../Presentationals/Icon';

type CommandListItemProps = {
    command: CommandItem;
    onItemSelect: (command: CommandItem) => void;
    highlighted: boolean;
};

const CommandListItem: React.FC<CommandListItemProps> = ({ command, onItemSelect, highlighted }) => {
    const { name, description, icon } = command;

    return (
        <li
            className={[styles.commandListItem, highlighted && styles.highlighted].join(' ')}
            onClick={() => onItemSelect(command)}
        >
            <Icon icon={icon} />
            <span>{name}</span>
            <small>{description}</small>
        </li>
    );
};

export default React.memo(CommandListItem);
