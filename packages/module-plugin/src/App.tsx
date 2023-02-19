import React, { useCallback, useEffect, useState } from 'react';

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
        preferences: { favouriteCommands: CommandId[]; recentCommands: CommandId[] };
    }
> {
    static tagName = 'command-bar-container';
    // static observedAttributes = ['styleuri'];
    static options = { shadow: true };

    static ENDPOINT_COMMANDS = '/neos/service/data-source/shel-neos-commandbar-commands';
    static ENDPOINT_GET_PREFERENCES = '/neos/shel-neos-commandbar/preferences/getpreferences';
    static ENDPOINT_SET_FAVOURITES = '/neos/shel-neos-commandbar/preferences/setfavourites';
    static ENDPOINT_SET_RECENT_COMMANDS = '/neos/shel-neos-commandbar/preferences/setrecentcommands';

    constructor() {
        super();
        this.state = {
            initialized: false,
            open: false,
            dragging: false,
            commands: {},
            preferences: { favouriteCommands: [], recentCommands: [] },
        };
    }

    /**
     * Load the commands and preferences from the server and set the state to initialized
     */
    async componentDidMount() {
        try {
            await fetch(App.ENDPOINT_GET_PREFERENCES, { credentials: 'include', method: 'GET' })
                .then((res) => res.json())
                .then((preferences) => {
                    this.setState({ preferences: preferences });
                });

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

    async setFavouriteCommands(commandIds: CommandId[]) {
        return await fetch(App.ENDPOINT_SET_FAVOURITES, {
            method: 'POST',
            body: JSON.stringify({ commandIds: commandIds }),
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }).then((res) => res.json());
    }

    async setRecentCommands(commandIds: CommandId[]) {
        return await fetch(App.ENDPOINT_SET_RECENT_COMMANDS, {
            method: 'POST',
            body: JSON.stringify({ commandIds: commandIds }),
            credentials: 'include',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
        }).then((res) => res.json());
    }

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
                                    setRecentCommands: this.setRecentCommands,
                                }}
                            />
                        </div>
                    )}
                </div>
            </>
        );
    }
}
