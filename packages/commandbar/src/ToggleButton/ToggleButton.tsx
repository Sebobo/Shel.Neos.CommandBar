import React from 'react';

import * as styles from './ToggleButton.module.css';

type ToggleButtonProps = {
    handleToggle: () => void;
    disabled?: boolean;
};

const ToggleButton: React.FC<ToggleButtonProps> = ({ handleToggle, disabled = false }) => {
    return (
        <button className={styles.toggleButton} onClick={handleToggle} disabled={disabled} title="Toggle command bar">
            <span>Search…</span>
            <span className={styles.buttonIcon}>⌘K</span>
        </button>
    );
};

export default React.memo(ToggleButton);
