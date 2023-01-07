import * as React from 'react';

import Icon from '../Presentationals/Icon';

import * as styles from './CommandBarFooter.module.css';

type FooterProps = {
    state: CommandBarState;
};

const CommandBarFooter: React.FC<FooterProps> = ({ state }) => {
    return (
        <footer className={styles.commandBarFooter}>
            {state.selectedGroup ? (
                <span className={styles.breadcrumb}>
                    <Icon icon={state.selectedGroup.icon} />
                    <small>{state.selectedGroup.name}</small>
                </span>
            ) : (
                <Icon icon="neos" />
            )}
        </footer>
    );
};

export default CommandBarFooter;
