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
                <nav className={[styles.results].join(' ')}>
                    <ul>
                        {Object.keys(options).map((commandId, index) => (
                            <CommandListItem
                                key={commandId}
                                ref={highlightedOption === index ? selectedElementRef : null}
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
