import React from 'react';

import * as styles from './ToggleButton.module.css';
import { classnames } from '../../helpers';

type ToggleButtonProps = {
    handleToggle: () => void;
    disabled?: boolean;
    label: string;
    title: string;
    active: boolean;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({ handleToggle, disabled = false, label, title, active }) => {
    return (
        <button
            className={classnames(styles.toggleButton, active && styles.toggleButtonActive)}
            onClick={handleToggle}
            disabled={disabled}
            title={title}
        >
            <span>{label}</span>
            <span className={styles.buttonIcon}>⌘K</span>
        </button>
    );
};

export default React.memo(ToggleButton);
