import { Component } from 'preact';
import React from 'preact/compat';

import { CommandBar, logger, ToggleButton } from '@neos-commandbar/commandbar';
import { PreferencesApi, CommandsApi, DocumentationApi, PackagesApi } from '@neos-commandbar/neos-api';
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
    static options = { shadow: true };

    constructor() {
        super();
        this.state = {
            initialized: false,
            open: false,
            dragging: false,
            commands: {
                neosDocs: {
                    name: 'Documentation',
                    icon: 'book',
                    description: 'Browse or search the Neos documentation',
                    canHandleQueries: true,
                    action: this.handleSearchNeosDocs.bind(this),
                },
                neosPackages: {
                    name: 'Packages',
                    icon: 'boxes',
                    description: 'Search for Neos packages',
                    canHandleQueries: true,
                    action: this.handleSearchNeosPackages.bind(this),
                },
            },
            preferences: { favouriteCommands: [], recentCommands: [], recentDocuments: [], showBranding: true },
        };
    }

    /**
     * Wrapper for the Neos backend translation api
     */
    private static translate(id: string, label = '', args = []): string {
        return (window as NeosModuleWindow).NeosCMS.I18n.translate(id, label, 'Shel.Neos.CommandBar', 'Main', args);
    }

    /**
     * Load the commands and preferences from the server and set the state to initialized
     */
    async componentDidMount() {
        try {
            const preferences = await PreferencesApi.getPreferences();
            const commands = await CommandsApi.getCommands();
            this.setState((prev) => ({ initialized: true, preferences, commands: { ...prev.commands, ...commands } }));

            document.addEventListener('keydown', (e) => {
                if (e.key === 'k' && e.metaKey) {
                    e.preventDefault();
                    this.handleToggle();
                }
            });
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

    handleSearchNeosDocs = async function* (query: string): CommandGeneratorResult {
        yield {
            success: true,
            message: `Searching for "${query}"`,
        };
        let error;
        const options = await DocumentationApi.searchNeosDocs(query).catch((e) => {
            logger.error('Could not search Neos docs', e);
            error = e.message;
        });
        if (error || !options) {
            yield {
                success: false,
                message: 'Search failed',
                view: error,
            };
        } else {
            yield {
                success: true,
                message: `${Object.keys(options).length} options match your query`,
                options,
            };
        }
    };

    handleSearchNeosPackages = async function* (query: string): CommandGeneratorResult {
        yield {
            success: true,
            message: `Searching for "${query}"`,
        };
        let error;
        const options = await PackagesApi.searchNeosPackages(query).catch((e) => {
            logger.error('Could not search Neos packages', e);
            error = e.message;
        });
        if (error || !options) {
            yield {
                success: !!options,
                message: options ? 'Finished search' : 'Search failed',
                view: error,
            };
        } else {
            yield {
                success: true,
                message: `${options.length} options match your query`,
                options,
            };
        }
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
                                    setFavouriteCommands: PreferencesApi.setFavouriteCommands,
                                    addRecentCommand: PreferencesApi.addRecentCommand,
                                }}
                                translate={App.translate}
                            />
                        </div>
                    )}
                </div>
            </>
        );
    }
}
