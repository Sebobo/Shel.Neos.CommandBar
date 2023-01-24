import React, { useCallback } from 'react';
import ReactDOM from 'react-dom';

import * as styles from './ModulePlugin.module.css';

import ToggleButton from '@neos-commandbar/commandbar/src/ToggleButton/ToggleButton';

window.addEventListener('load', async (): Promise<void> => {
    while (!window.NeosCMS?.I18n?.initialized) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    console.log("Hi I'm the module plugin");
    const topBarLeft = document.querySelector('.neos-top-bar-left');
    const pluginContainer = document.createElement('div');
    pluginContainer.id = 'shel-neos-commandbar';
    topBarLeft.appendChild(pluginContainer);

    const App: React.FC = () => {
        const handleToggle = useCallback(() => {
            alert('Command bar for backend modules not implemented yet');
        }, []);

        return (
            <div className={styles.pluginWrap}>
                <ToggleButton handleToggle={handleToggle} />
            </div>
        );
    };

    ReactDOM.render(<App />, pluginContainer);
});
