import React from 'react';

import * as styles from './ToggleButton.module.css';

type ToggleButtonProps = {
    handleToggle: () => void;
    disabled?: boolean;
    label: string;
    title: string;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({ handleToggle, disabled = false, label, title }) => {
    return (
        <button className={styles.toggleButton} onClick={handleToggle} disabled={disabled} title={title}>
            <span>{label}</span>
            <span className={styles.buttonIcon}>⌘K</span>
        </button>
    );
};

export default React.memo(ToggleButton);
