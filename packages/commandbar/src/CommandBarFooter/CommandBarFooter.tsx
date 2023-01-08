import * as React from 'react';

import Icon from '../Presentationals/Icon';

import * as styles from './CommandBarFooter.module.css';

type FooterProps = {
    selectedGroup: CommandGroup;
};

const CommandBarFooter: React.FC<FooterProps> = ({ selectedGroup }) => {
    return (
        <footer className={styles.commandBarFooter}>
            {selectedGroup ? (
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
