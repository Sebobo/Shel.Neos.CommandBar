import React, { useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import * as retargetEvents from 'react-shadow-dom-retarget-events';

import * as styles from './ModulePlugin.module.css';

import { ToggleButton, logger, CommandBar } from '@neos-commandbar/commandbar';

const ENDPOINT_COMMANDS = '/neos/service/data-source/shel-neos-commandbar-commands';

const IconComponent: React.FC<IconProps> = ({ icon, spin = false }) => {
    return (
        <svg className={spin ? styles.spin : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
                fill="currentColor"
                d="M509.5 184.6 458.9 32.8C452.4 13.2 434.1 0 413.4 0H272v192h238.7c-.4-2.5-.4-5-1.2-7.4zM240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zM0 224v240c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V224H0z"
            />
        </svg>
    );
};

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

class CommandBarContainer extends HTMLElement {
    mountPoint: HTMLDivElement;

    createApp() {
        return React.createElement(App, {}, React.createElement('slot'));
    }

    // noinspection JSUnusedGlobalSymbols
    connectedCallback() {
        this.mountPoint = document.createElement('div');
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(this.mountPoint);

        const style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('href', this.getAttribute('styleuri'));
        shadowRoot.append(style);

        ReactDOM.render(this.createApp(), this.mountPoint);
        retargetEvents(shadowRoot);
    }
}
customElements.define('command-bar-container', CommandBarContainer);

window.addEventListener('neoscms-i18n-initialized', async (): Promise<void> => {
    const commandBarStyleTag = document.querySelector(
        'link[rel="stylesheet"][href*="Shel.Neos.CommandBar"]'
    ) as HTMLLinkElement;

    const topBarLeft = document.querySelector('.neos-top-bar-left');
    const pluginContainer = document.createElement('command-bar-container');
    pluginContainer.id = 'shel-neos-commandbar';
    pluginContainer.setAttribute('styleuri', commandBarStyleTag.href);
    topBarLeft.appendChild(pluginContainer);
});
