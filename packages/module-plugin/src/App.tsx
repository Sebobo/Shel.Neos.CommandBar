import { Component } from 'preact';
import React from 'preact/compat';

import { classnames, CommandBar, logger, ToggleButton } from '@neos-commandbar/commandbar';
import { PreferencesApi, CommandsApi, DocumentationApi, PackagesApi } from '@neos-commandbar/neos-api';
import IconComponent from './IconComponent';

import * as styles from './ModulePlugin.module.css';
import * as theme from '@neos-commandbar/commandbar/src/Theme.module.css';

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
    private static i18nRegistry: NeosI18n;

    constructor() {
        super();
        App.i18nRegistry = (window as NeosModuleWindow).NeosCMS.I18n;
        this.state = {
            initialized: false,
            open: false,
            dragging: false,
            // TODO: Only load the search commands in dev context
            commands: {
                searchNeosDocs: {
                    name: App.translate('CommandBarUiPlugin.command.documentation', 'Documentation'),
                    description: App.translate(
                        'CommandBarUiPlugin.command.documentation.description',
                        'Browse or search the Neos documentation'
                    ),
                    icon: 'book',
                    canHandleQueries: true,
                    action: this.handleSearchNeosDocs.bind(this),
                },
                searchNeosPackages: {
                    name: App.translate('CommandBarUiPlugin.command.packages', 'Packages'),
                    description: App.translate(
                        'CommandBarUiPlugin.command.packages.description',
                        'Search for Neos packages'
                    ),
                    icon: 'boxes',
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
    private static translate: TranslateFunction = (id, paramsOrFallback, fallback) => {
        if (typeof paramsOrFallback === 'string') {
            fallback = paramsOrFallback;
            paramsOrFallback = {};
        }
        return App.i18nRegistry.translate(id, fallback, 'Shel.Neos.CommandBar', 'Main', paramsOrFallback);
    };

    /**
     * Load the commands and preferences from the server and set the state to initialized
     */
    async componentDidMount() {
        try {
            const preferences = await PreferencesApi.getPreferences();
            const commands = await CommandsApi.getCommands();
            this.setState((prev) => ({ initialized: true, preferences, commands: { ...prev.commands, ...commands } }));

            document.addEventListener('keydown', (e) => {
                if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                    e.stopPropagation();
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
            message: App.translate(
                'CommandBarUiPlugin.command.documentation.searching',
                { query },
                `Search for "${query}"`
            ),
        };
        let error;
        const options = await DocumentationApi.searchNeosDocs(query).catch((e) => {
            logger.error('Could not search Neos docs', e);
            error = e.message;
        });
        if (error || !options) {
            yield {
                success: false,
                message: App.translate('CommandBarUiPlugin.command.documentation.error', 'Search failed'),
                view: error,
            };
        } else {
            yield {
                success: true,
                message: App.translate(
                    'CommandBarUiPlugin.command.documentation.matches',
                    { matches: Object.keys(options).length },
                    `${Object.values(options).length} options match your query`
                ),
                options,
            };
        }
    };

    handleSearchNeosPackages = async function* (query: string): CommandGeneratorResult {
        yield {
            success: true,
            message: App.translate('CommandBarUiPlugin.command.packages.searching', { query }, `Search for "${query}"`),
        };
        let error;
        const options = await PackagesApi.searchNeosPackages(query).catch((e) => {
            logger.error('Could not search Neos packages', e);
            error = e.message;
        });
        if (error || !options) {
            yield {
                success: false,
                message: App.translate('CommandBarUiPlugin.command.packages.error', 'Search failed'),
                view: error,
            };
        } else {
            yield {
                success: true,
                message: App.translate(
                    'CommandBarUiPlugin.command.packages.matches',
                    { matches: Object.values(options).length },
                    `${Object.values(options).length} options match your query`
                ),
                options,
            };
        }
    };

    render() {
        const { initialized, open, dragging, commands, preferences } = this.state;

        return (
            <>
                <style>{'@import "' + this.props.styleuri + '";'}</style>
                <div className={classnames(styles.pluginWrap, theme.commandBarTheme)}>
                    <ToggleButton
                        handleToggle={this.handleToggle}
                        disabled={!initialized}
                        label={App.translate('ToggleButton.label', 'Search…')}
                        title={App.translate('ToggleButton.title', 'Search and execute commands')}
                        active={open}
                    />
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
