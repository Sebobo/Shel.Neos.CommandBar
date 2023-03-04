import { Component } from 'preact';
import React from 'preact/compat';

import { CommandBar, logger, ToggleButton } from '@neos-commandbar/commandbar';
import { PreferencesApi, CommandsApi, DocumentationApi } from '@neos-commandbar/neos-api';
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
        const results = await DocumentationApi.searchNeosDocs(query).catch((e) =>
            logger.error('Could not search Neos docs', e)
        );
        if (!results) {
            return {
                success: false,
                message: 'Search failed',
            };
        }
        yield {
            success: true,
            message: `${results.length} options match your query`,
            options: results.reduce((carry, item: Command, i) => {
                carry[`result_${i}`] = {
                    id: `result_${i}`,
                    ...item,
                };
                return carry;
            }, {} as FlatCommandList),
        };
        return {
            success: true,
            message: 'Finished search',
        };
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
