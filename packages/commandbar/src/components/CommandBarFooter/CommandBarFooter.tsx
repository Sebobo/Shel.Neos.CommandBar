import React from 'react';
import { useComputed } from '@preact/signals';

import { useCommandBarState } from '../../state';
import IconWrapper from '../IconWrapper/IconWrapper';
import Branding from './Branding';
import { IconNeos, IconSpinner } from '../Icons';

import * as styles from './CommandBarFooter.module.css';

const CommandBarFooter: React.FC = () => {
    const {
        state: {
            activeCommandId,
            resultCommandId,
            activeCommandMessage,
            commands,
            result,
            selectedCommandGroup,
            expanded
        },
        Icon
    } = useCommandBarState();

    const commandForContext = useComputed<Command>(() => {
        const commandId = activeCommandId.value ?? resultCommandId.value;
        if (!commandId) return null;
        // FIXME: This will not be correct when a command and an option in the result have the same id
        return commandId
            ? commands.value[commandId] ?? result.value.options[commandId]
            : null;
    });

    const isRunning = activeCommandId.value !== null;

    if (!expanded.value) return null;

    return (
        <footer className={styles.commandBarFooter}>
            {isRunning ? (
                <span className={styles.activity}>
                    <IconWrapper>
                        <IconSpinner />
                    </IconWrapper>
                    <em>
                        {commandForContext.value.name}{activeCommandMessage.value ? '﹘' + activeCommandMessage.value : ''}
                    </em>
                </span>
            ) : commandForContext.value ? (
                <span className={styles.breadcrumb}>
                    <Icon icon={commandForContext.value.icon} />
                    <small>{commandForContext.value.name}</small>
                </span>
            ) : selectedCommandGroup.value ? (
                <span className={styles.breadcrumb}>
                    <Icon icon={commands.value[selectedCommandGroup.value].icon} />
                    <small>{commands.value[selectedCommandGroup.value].name}</small>
                </span>
            ) : (
                <IconWrapper>
                    <IconNeos />
                </IconWrapper>
            )}
            <Branding />
        </footer>
    );
};

export default React.memo(CommandBarFooter);
