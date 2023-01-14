import * as React from 'react';

import Icon from '../Presentationals/Icon';

import * as styles from './CommandBarFooter.module.css';

type FooterProps = {
    selectedGroup: ProcessedCommandItem;
    runningCommand: ProcessedCommandItem;
    runningCommandMessage: string | null;
};

const CommandBarFooter: React.FC<FooterProps> = ({ selectedGroup, runningCommand, runningCommandMessage }) => {
    return (
        <footer className={styles.commandBarFooter}>
            {runningCommand ? (
                <span className={styles.activity}>
                    <Icon icon="circle-notch" spin={true} />
                    <em>
                        {runningCommand.name} ‒ {runningCommandMessage}
                    </em>
                </span>
            ) : selectedGroup ? (
                <span className={styles.breadcrumb}>
                    <Icon icon={selectedGroup.icon} />
                    <small>{selectedGroup.name}</small>
                </span>
            ) : (
                <Icon icon="neos" />
            )}
        </footer>
    );
};

export default CommandBarFooter;
