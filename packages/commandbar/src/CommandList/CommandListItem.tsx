import * as React from 'react';

import * as styles from './CommandListItem.module.css';
import Icon from '../Presentationals/Icon';

type CommandListItemProps = {
    command: CommandItem;
    onItemSelect: (command: CommandItem) => void;
    highlighted: boolean;
    ref?: React.Ref<HTMLLIElement>;
};

// eslint-disable-next-line react/display-name
const CommandListItem: React.FC<CommandListItemProps> = React.forwardRef(
    ({ command, onItemSelect, highlighted }, ref) => {
        const { name, description, icon } = command;

        return (
            <li
                className={[styles.commandListItem, highlighted && styles.highlighted].join(' ')}
                onClick={() => onItemSelect(command)}
                ref={ref}
            >
                <Icon icon={icon} />
                <span>{name}</span>
                <small>{description}</small>
            </li>
        );
    }
);

export default React.memo(CommandListItem, (prev, next) => {
    return prev.command.name === next.command.name && prev.ref === next.ref;
});
