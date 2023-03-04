import React, { useEffect } from 'react';

import { useCommandBarState, useCommandInput } from '../../state';
import CommandListItem from '../CommandListItem/CommandListItem';

import * as styles from './CommandResultsView.module.css';

const CommandResultsView: React.FC = () => {
    const {
        state: { result, highlightedOption, activeCommandId },
        Icon,
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const navRef = React.useRef<HTMLElement>(null);

    useEffect(() => {
        navRef.current
            ?.querySelector(`li:nth-child(${highlightedOption})`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [highlightedOption, navRef]);

    if (!result) return null;

    const { options, view, message } = result;

    return (
        <div className={styles.commandResultsView}>
            {message && <h6>{message}</h6>}
            {view ? <div>{view}</div> : ''}
            {options && (
                <nav className={[styles.results].join(' ')}>
                    <ul>
                        {Object.keys(options).map((commandId, index) => (
                            <CommandListItem
                                key={commandId}
                                command={options[commandId]}
                                onItemSelect={executeCommand}
                                highlighted={highlightedOption === index}
                                runningCommandId={activeCommandId}
                                Icon={Icon}
                            />
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default React.memo(CommandResultsView);
