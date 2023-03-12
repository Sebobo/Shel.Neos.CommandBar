import React from 'react';
import { useComputed } from '@preact/signals';

import { useCommandBarState } from '../../state';
import IconWrapper from '../IconWrapper/IconWrapper';
import Branding from './Branding';
import { IconNeos, IconSpinner } from '../Icons';

import * as styles from './CommandBarFooter.module.css';

const CommandBarFooter: React.FC = () => {
    const {
        state: { activeCommandId, activeCommandMessage, commands, result, selectedCommandGroup, expanded },
        Icon,
    } = useCommandBarState();

    const runningCommand = useComputed<Command>(() => {
        if (!activeCommandId.value) return null;
        // FIXME: This will not be correct when a command and an option in the result have the same id
        return activeCommandId.value
            ? commands.value[activeCommandId.value] ?? result.value.options[activeCommandId.value]
            : null;
    });

    if (!expanded.value) return null;

    return (
        <footer className={styles.commandBarFooter}>
            {activeCommandId.value ? (
                <span className={styles.activity}>
                    <IconWrapper>
                        <IconSpinner />
                    </IconWrapper>
                    <em>
                        {runningCommand.value.name} ‒ {activeCommandMessage}
                    </em>
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
