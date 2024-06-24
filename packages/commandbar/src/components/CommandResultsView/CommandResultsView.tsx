import React from 'react';
import { useComputed, useSignalEffect } from '@preact/signals';

import { useCommandBarState, useCommandExecutor, useIntl } from '../../state';
import CommandListItem from '../CommandListItem/CommandListItem';

import * as styles from './CommandResultsView.module.css';

const CommandResultsView: React.FC = () => {
    const {
        state: { result, highlightedOption, activeCommandId },
    } = useCommandBarState();
    const { executeCommand } = useCommandExecutor();
    const { translate } = useIntl();
    const navRef = React.useRef<HTMLElement>(null);
    const highlightedId = useComputed<CommandId>(() =>
        result.value ? Object.values(result.value.options)[highlightedOption.value].id : null
    );
    const isLoading = activeCommandId.value !== null;

    useSignalEffect(() => {
        const highlightedIndex = highlightedOption.value;
        navRef.current
            ?.querySelector(`li:nth-child(${highlightedIndex})`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    const { options, view, message } = result.value ?? {};

    return (
        <div className={styles.commandResultsView}>
            {message && <h6 className={styles.message}>{message}</h6>}
            {isLoading ? <div>{translate('CommandResultsView.waitingForResults', 'Waiting for results…')}</div> : ''}
            {!isLoading && view ? <div>{view}</div> : ''}
            {!isLoading && options && (
                <nav className={styles.results} ref={navRef}>
                    <ul>
                        {Object.keys(options).map((commandId) => (
                            <CommandListItem
                                key={commandId}
                                command={options[commandId]}
                                onItemSelect={executeCommand}
                                highlightedId={highlightedId}
                            />
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default CommandResultsView;
