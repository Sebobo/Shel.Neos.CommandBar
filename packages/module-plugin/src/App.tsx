import { Component } from 'preact';
import React from 'preact/compat';

import { CommandBar, logger, ToggleButton } from '@neos-commandbar/commandbar';
import IconComponent from './IconComponent';

import * as styles from './ModulePlugin.module.css';

/**
 * This is a custom element that is used to render the command bar inside a shadow dom to prevent Neos and module
 * styles from leaking into the component
 */
export default class App extends Component<
    {
        styleuri: string;
    },
    {
        initialized: boolean;
        open: boolean;
        dragging: boolean;
        commands: HierarchicalCommandList;
        preferences: {
            favouriteCommands: CommandId[];
            recentCommands: CommandId[];
            recentDocuments: NodeContextPath[];
            showBranding: boolean;
        };
    }
> {
    static tagName = 'command-bar-container';
    // static observedAttributes = ['styleuri'];
    static options = { shadow: true };

    static ENDPOINT_COMMANDS = '/neos/service/data-source/shel-neos-commandbar-commands';
    static ENDPOINT_GET_PREFERENCES = '/neos/shel-neos-commandbar/preferences/getpreferences';
    static ENDPOINT_SET_FAVOURITE_COMMANDS = '/neos/shel-neos-commandbar/preferences/setfavourites';
    static ENDPOINT_ADD_RECENT_COMMAND = '/neos/shel-neos-commandbar/preferences/addrecentcommand';

    constructor() {
        super();
        this.state = {
            initialized: false,
            open: false,
            dragging: false,
            commands: {},
            preferences: { favouriteCommands: [], recentCommands: [], recentDocuments: [], showBranding: true },
        };
    }

    /**
     * Load the commands and preferences from the server and set the state to initialized
     */
    async componentDidMount() {
        // TODO: Create custom fetch method that handles errors and credentials
        try {
            // TODO: Add typings for preferences
            await fetch(App.ENDPOINT_GET_PREFERENCES, { credentials: 'include', method: 'GET' })
                .then((res) => res.json())
                .then((preferences) => {
                    this.setState({ preferences: preferences });
                });

            // TODO: Add typings for commands
            await fetch(App.ENDPOINT_COMMANDS, {
                credentials: 'include',
            })
                .then((res) => res.json())
                .then((commands) => {
                    this.setState({ commands: commands });
                });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'k' && e.metaKey) {
                    e.preventDefault();
                    this.handleToggle();
                }
            });

            this.setState({ initialized: true });
        } catch (e) {
            logger.error(e);
        }
    }

    handleToggle = () => {
        this.setState(({ open }) => ({
            open: !open,
        }));
    };

    handleDrag = (dragging: boolean) => {
        this.setState({ dragging: dragging });
    };

    setPreference = async (endpoint: string, data: any): Promise<void> => {
        return await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }).then((res) => res.json());
    };

    setFavouriteCommands = async (commandIds: CommandId[]) => {
        return this.setPreference(App.ENDPOINT_SET_FAVOURITE_COMMANDS, { commandIds: commandIds });
    };

    addRecentCommand = async (commandId: CommandId) => {
        // TODO: Check if sendBeacon is a better option here to reduce the impact on the user
        return this.setPreference(App.ENDPOINT_ADD_RECENT_COMMAND, { commandId: commandId });
    };

    render() {
        const { initialized, open, dragging, commands, preferences } = this.state;

        return (
            <>
                <style>{'@import "' + this.props.styleuri + '";'}</style>
                <div className={styles.pluginWrap}>
                    <ToggleButton handleToggle={this.handleToggle} disabled={!initialized} />
                    {initialized && (
                        <div
                            className={[styles.fullScreenLayer, open && styles.open].join(' ')}
                            onDragOver={(e) => e.preventDefault()}
                            style={dragging ? { pointerEvents: 'all' } : null}
                        >
                            <CommandBar
                                commands={commands}
                                open={open}
                                toggleOpen={this.handleToggle}
                                onDrag={this.handleDrag}
                                IconComponent={IconComponent}
                                userPreferences={{
                                    ...preferences,
                                    setFavouriteCommands: this.setFavouriteCommands,
                                    addRecentCommand: this.addRecentCommand,
                                }}
                            />
                        </div>
                    )}
                </div>
            </>
        );
    }
}
