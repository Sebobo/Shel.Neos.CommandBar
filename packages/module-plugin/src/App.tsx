import React, { useCallback, useEffect, useState } from 'react';

import { CommandBar, logger, ToggleButton } from '@neos-commandbar/commandbar';
import IconComponent from './IconComponent';

import * as styles from './ModulePlugin.module.css';

const ENDPOINT_COMMANDS = '/neos/service/data-source/shel-neos-commandbar-commands';

const App: React.FC = () => {
    const [initialized, setInitialized] = useState(false);
    const [open, setOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [commands, setCommands] = useState<HierarchicalCommandList>({});

    const handleToggle = useCallback(() => {
        setOpen((open) => !open);
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
                logger.debug(
                    '[CommandBar] Initialized command bar for backend modules with the following commands:',
                    Object.keys(commands)
                );
            })
            .catch((e) => {
                logger.error('[CommandBar]', e);
            });
    }, []);

    return (
        <div className={styles.pluginWrap}>
            <ToggleButton handleToggle={handleToggle} disabled={!initialized} />
            {initialized && (
                <div
                    className={[styles.fullScreenLayer, open && styles.open].join(' ')}
                    onDragOver={(e) => e.preventDefault()}
                    style={dragging ? { pointerEvents: 'all' } : null}
                >
                    <CommandBar
                        commands={commands}
                        open={open}
                        toggleOpen={handleToggle}
                        onDrag={setDragging}
                        IconComponent={IconComponent}
                    />
                </div>
            )}
        </div>
    );
};

export default App;
