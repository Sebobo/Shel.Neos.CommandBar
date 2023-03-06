import React from 'react';
import { useComputed, useSignalEffect } from '@preact/signals';

import { useCommandBarState, useCommandInput } from '../../state';
import CommandListItem from '../CommandListItem/CommandListItem';

import * as styles from './CommandResultsView.module.css';

const CommandResultsView: React.FC = () => {
    const {
        state: { result, highlightedOption },
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const navRef = React.useRef<HTMLElement>(null);
    const highlightedCommand = useComputed<CommandId>(() =>
        result.value ? Object.values(result.value.options)[highlightedOption.value].id : null
    );

    useSignalEffect(() => {
        navRef.current
            ?.querySelector(`li:nth-child(${highlightedOption})`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    if (!result.value) return null;

    const { options, view, message } = result.value;

    return (
        <div className={styles.commandResultsView}>
            {message && <h6>{message}</h6>}
            {view ? <div>{view}</div> : ''}
            {options && (
                <nav className={[styles.results].join(' ')}>
                    <ul>
                        {Object.keys(options).map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                command={options[commandId]}
                                onItemSelect={executeCommand}
                                highlightedId={highlightedCommand}
                            />
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default CommandResultsView;
