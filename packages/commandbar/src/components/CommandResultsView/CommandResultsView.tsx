import React, { useEffect } from 'react';

import { useCommandBarState, useCommandInput } from '../../state';
import CommandListItem from '../CommandListItem/CommandListItem';

import * as styles from './CommandResultsView.module.css';

const CommandResultsView: React.FC = () => {
    const {
        state: { result, highlightedResultItem, runningCommandId },
    } = useCommandBarState();
    const { executeCommand } = useCommandInput();
    const selectedElementRef = React.useRef(null);

    useEffect(() => {
        selectedElementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, [selectedElementRef.current]);

    if (!result) return null;

    const { options, view, message } = result;

    return (
        <div className={styles.commandResultsView}>
            {message && <h6>{message}</h6>}
            {view ? <div>{view}</div> : ''}
            {options && (
                <nav className={[styles.results, !!result && styles.disabled].join(' ')}>
                    <ul>
                        {Object.keys(options).map((commandId, index) => (
                            <CommandListItem
                                key={commandId}
                                ref={highlightedResultItem === index ? selectedElementRef : null}
                                command={options[commandId]}
                                onItemSelect={executeCommand}
                                highlighted={highlightedResultItem === index}
                                runningCommandId={runningCommandId}
                            />
                        ))}
                    </ul>
                </nav>
            )}
        </div>
    );
};

export default React.memo(CommandResultsView);
