import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

import * as styles from './ModulePlugin.module.css';

import ToggleButton from '@neos-commandbar/commandbar/src/ToggleButton/ToggleButton';

const ENDPOINT_COMMANDS = '/neos/service/data-source/shel-neos-commandbar-commands';

window.addEventListener('load', async (): Promise<void> => {
    while (!window.NeosCMS?.I18n?.initialized) {
        await new Promise((resolve) => setTimeout(resolve, 50));
    }

    const topBarLeft = document.querySelector('.neos-top-bar-left');
    const pluginContainer = document.createElement('div');
    pluginContainer.id = 'shel-neos-commandbar';
    topBarLeft.appendChild(pluginContainer);

    const App: React.FC = () => {
        const [initialized, setInitialized] = useState(false);
        const [commands, setCommands] = useState<HierarchicalCommandList>({});

        const handleToggle = useCallback(() => {
            alert('Command bar for backend modules not implemented yet');
        }, []);

        // Load commands
        useEffect(() => {
            fetch(ENDPOINT_COMMANDS, {
                credentials: 'include',
            })
                .then((res) => res.json())
                .then((commands: ModuleCommands) => {
                    setCommands({ ...commands });
                    setInitialized(true);
                    console.debug(
                        '[CommandBar] Initialized command bar for backend modules with the following commands:',
                        Object.keys(commands)
                    );
                })
                .catch((e) => {
                    console.error('[CommandBar]', e);
                });
        }, []);

        return (
            <div className={styles.pluginWrap}>
                <ToggleButton handleToggle={handleToggle} disabled={!initialized} />
            </div>
        );
    };

    ReactDOM.render(<App />, pluginContainer);
});
