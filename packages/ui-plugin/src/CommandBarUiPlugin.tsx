import * as React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

// Neos dependencies are provided by the UI
// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';
// @ts-ignore
import { selectors, actions } from '@neos-project/neos-ui-redux-store';
import { Icon } from '@neos-project/react-ui-components';

import { CommandBar, logger, ToggleButton, classnames } from '@neos-commandbar/commandbar';
import { CommandsApi, PreferencesApi, DocumentationApi, NodesApi, PackagesApi } from '@neos-commandbar/neos-api';

import { actions as commandBarActions, NeosRootState, selectors as commandBarSelectors } from './actions';

import * as styles from './CommandBarUiPlugin.module.css';
import * as theme from '@neos-commandbar/commandbar/src/Theme.module.css';
import { addRecentDocument } from '@neos-commandbar/neos-api/src/preferences';

type CommandBarUiPluginProps = {
    addNode: (
        referenceNodeContextPath: string,
        referenceNodeFusionPath: string | null,
        preferredMode: string,
        nodeType?: string
    ) => void;
    baseWorkspace: string;
    commandBarOpen: boolean;
    config: CommandBarConfig;
    // TODO: Reimplement discardAction
    // discardAction: (contextPaths: string[]) => void;
    documentNode: CRNode;
    editPreviewMode: string;
    editPreviewModes: EditPreviewModes;
    focusedNodeContextPath: string;
    handleHotkeyAction: (action: () => any) => void;
    hotkeyRegistry: any;
    i18nRegistry: I18nRegistry;
    isWorkspaceReadOnly: boolean;
    plugins: Record<string, () => HierarchicalCommandList>;
    // TODO: Reimplement publishAction
    // publishAction: (contextPaths: string[], baseWorkspace: string) => void;
    publishableNodes: CRNode[];
    publishableNodesInDocument: CRNode[];
    previewUrl: string | null;
    setActiveContentCanvasSrc: (uri: string) => void;
    setActiveContentCanvasContextPath: (contextPath: string) => void;
    setEditPreviewMode: (mode: string) => void;
    siteNode: CRNode;
    toggleCommandBar: () => void;
    changeBaseWorkspaceAction: (workspace: string) => void;
    neos: {
        configuration: {
            allowedTargetWorkspaces: {
                allowedWorkspaces: Record<
                    string,
                    {
                        name: string;
                        title: string;
                        readonly: boolean;
                        description: string;
                    }
                >;
            };
        };
    };
};

type CommandBarUiPluginState = {
    loaded: boolean;
    dragging: boolean;
    favouriteCommands: CommandId[];
    recentCommands: CommandId[];
    recentDocuments: RecentDocument[];
    showBranding: boolean;
    commands: HierarchicalCommandList;
};

const IconComponent: React.FC<IconProps> = ({ icon, spin = false }) => <Icon icon={icon} spin={spin} />;

class CommandBarUiPlugin extends React.PureComponent<CommandBarUiPluginProps, CommandBarUiPluginState> {
    static propTypes = {
        addNode: PropTypes.func.isRequired,
        baseWorkspace: PropTypes.string.isRequired,
        commandBarOpen: PropTypes.bool,
        config: PropTypes.object.isRequired,
        // TODO: Reimplement discardAction
        // discardAction: PropTypes.func.isRequired,
        documentNode: PropTypes.object,
        editPreviewMode: PropTypes.string.isRequired,
        editPreviewModes: PropTypes.object.isRequired,
        focusedNodeContextPath: PropTypes.string,
        handleHotkeyAction: PropTypes.func.isRequired,
        hotkeyRegistry: PropTypes.object.isRequired,
        i18nRegistry: PropTypes.object.isRequired,
        isWorkspaceReadOnly: PropTypes.bool,
        // TODO: Reimplement publishAction
        // publishAction: PropTypes.func.isRequired,
        publishableNodes: PropTypes.array,
        publishableNodesInDocument: PropTypes.array,
        previewUrl: PropTypes.string,
        setActiveContentCanvasSrc: PropTypes.func.isRequired,
        setActiveContentCanvasContextPath: PropTypes.func.isRequired,
        setEditPreviewMode: PropTypes.func.isRequired,
        siteNode: PropTypes.object,
        toggleCommandBar: PropTypes.func.isRequired,
        neos: PropTypes.object.isRequired,
    };

    constructor(props: CommandBarUiPluginProps) {
        super(props);
        this.state = {
            loaded: false,
            dragging: false,
            favouriteCommands: [],
            recentCommands: [],
            recentDocuments: [],
            showBranding: true,
            commands: {
                addNode: {
                    name: this.translate('CommandBarUiPlugin.command.addNode', 'Add content'),
                    icon: 'plus',
                    description: this.translate('CommandBarUiPlugin.command.addNode.description', 'Add new content'),
                    action: this.handleAddNode,
                },
                searchDocuments: {
                    name: this.translate('CommandBarUiPlugin.command.searchDocuments', 'Search documents'),
                    icon: 'search',
                    description: this.translate(
                        'CommandBarUiPlugin.command.searchDocuments.description',
                        'Search and navigate to documents'
                    ),
                    action: this.handleSearchNode.bind(this),
                    canHandleQueries: true,
                },
                switchWorkspace: {
                    name: this.translate('CommandBarUiPlugin.command.switchWorkspace', 'Switch workspace'),
                    icon: 'exchange-alt',
                    description: this.translate(
                        'CommandBarUiPlugin.command.switchWorkspace.description',
                        'Switch to another workspace'
                    ),
                    subCommands: this.buildCommandsFromWorkspaces(),
                },
                // TODO: Reimplement publishAction
                // publishDiscard: {
                //     name: this.translate('CommandBarUiPlugin.command.publishDiscard', 'Publish / discard'),
                //     description: this.translate(
                //         'CommandBarUiPlugin.command.publishDiscard.description',
                //         'Publish or discard changes'
                //     ),
                //     icon: 'check',
                //     subCommands: {
                //         publish: {
                //             name: this.translate('CommandBarUiPlugin.command.publish', 'Publish'),
                //             description: this.translate(
                //                 'CommandBarUiPlugin.command.publish.description',
                //                 'Publish changes in this document'
                //             ),
                //             icon: 'check',
                //             action: this.handlePublish,
                //         },
                //         publishAll: {
                //             name: this.translate('CommandBarUiPlugin.command.publishAll', 'Publish all'),
                //             description: this.translate(
                //                 'CommandBarUiPlugin.command.publishAll.description',
                //                 'Publish changes in all documents'
                //             ),
                //             icon: 'check-double',
                //             action: this.handlePublishAll,
                //         },
                //         discard: {
                //             name: this.translate('CommandBarUiPlugin.command.discard', 'Discard'),
                //             description: this.translate(
                //                 'CommandBarUiPlugin.command.discard.description',
                //                 'Discard changes in the current document'
                //             ),
                //             icon: 'ban',
                //             action: this.handleDiscard,
                //         },
                //         discardAll: {
                //             name: this.translate('CommandBarUiPlugin.command.discardAll', 'Discard all'),
                //             description: this.translate(
                //                 'CommandBarUiPlugin.command.discardAll.description',
                //                 'Discard changes in all documents'
                //             ),
                //             icon: 'ban',
                //             action: this.handleDiscardAll,
                //         },
                //     },
                // },
                quickActions: {
                    name: this.translate('CommandBarUiPlugin.command.quickActions', 'Quick actions'),
                    icon: 'keyboard',
                    description: this.translate(
                        'CommandBarUiPlugin.command.quickActions.description',
                        'Execute hotkeys'
                    ),
                    subCommands: this.buildCommandsFromHotkeys(),
                },
                switchEditPreviewMode: {
                    name: this.translate(
                        'CommandBarUiPlugin.command.switchEditPreviewMode',
                        'Switch edit/preview mode'
                    ),
                    icon: 'pencil',
                    description: this.translate(
                        'CommandBarUiPlugin.command.switchEditPreviewMode.description',
                        'Switch between edit and preview modes'
                    ),
                    subCommands: this.buildCommandsFromEditPreviewModes(),
                },
                openPreview: {
                    name: this.translate('CommandBarUiPlugin.command.openPreview', 'Open preview'),
                    description: this.translate(
                        'CommandBarUiPlugin.command.openPreview.description',
                        'Open the preview for current document'
                    ),
                    icon: 'external-link-alt',
                    action: async () => {
                        if (this.props.previewUrl) {
                            window.open(this.props.previewUrl, '_blank', 'noopener,noreferrer')?.focus();
                        } else {
                            logger.warn('No preview url to open');
                        }
                    },
                    closeOnExecute: true,
                },
                recentDocument: {
                    name: this.translate('CommandBarUiPlugin.command.recentDocuments', 'Recent documents'),
                    description: this.translate(
                        'CommandBarUiPlugin.command.recentDocuments.description',
                        'Open a recently visited documents'
                    ),
                    icon: 'history',
                    action: this.showRecentDocuments.bind(this),
                },
            },
        };

        if (props.config.features.searchNeosDocs) {
            this.state.commands.searchNeosDocs = {
                name: this.translate('CommandBarUiPlugin.command.documentation', 'Documentation'),
                description: this.translate(
                    'CommandBarUiPlugin.command.documentation.description',
                    'Browse or search the Neos documentation'
                ),
                icon: 'book',
                canHandleQueries: true,
                action: this.handleSearchNeosDocs.bind(this),
            };
        }
        if (props.config.features.searchNeosPackages) {
            this.state.commands.searchNeosPackages = {
                name: this.translate('CommandBarUiPlugin.command.packages', 'Packages'),
                description: this.translate(
                    'CommandBarUiPlugin.command.packages.description',
                    'Search for Neos packages'
                ),
                icon: 'boxes',
                canHandleQueries: true,
                action: this.handleSearchNeosPackages.bind(this),
            };
        }
    }

    mapHotkeyIdToIcon(id: string) {
        let actionName = id.split('.').pop();

        // Some actions have the name 'toggle' with a suffix, e.g. 'toggleFullScreen'
        if (actionName.indexOf('toggle') >= 0) {
            actionName = 'toggle';
        }

        switch (actionName) {
            case 'toggle':
                return 'toggle-on';
            case 'reload':
                return 'redo';
            case 'cancel':
            case 'close':
                return 'window-close';
            case 'apply':
                return 'check';
        }
        return 'neos';
    }

    async componentDidMount() {
        const { plugins } = this.props;

        // Load 3rd party commands
        let pluginCommands: HierarchicalCommandList = {};
        if (plugins) {
            for (const pluginName of Object.keys(plugins)) {
                const plugin = plugins[pluginName];
                try {
                    const pluginResult = await plugin();
                    if (Object.keys(pluginResult).length > 0) {
                        pluginCommands = { ...pluginCommands, ...pluginResult };
                    }
                } catch (e) {
                    logger.warn(`Could not load commands from plugin ${pluginName}`, e);
                }
            }
        }

        // Load commands from data source which are not available via the UI API
        const commands = await CommandsApi.getCommands().catch((error) => {
            logger.error('Failed to load commands', error);
        });

        // Load user preferences
        const preferences = await PreferencesApi.getPreferences().catch((error) => {
            logger.error('Failed to load user preferences', error);
        });

        if (!preferences || !commands) return;

        this.setState((prev) => ({
            loaded: true,
            ...preferences,
            commands: { ...prev.commands, ...commands, ...pluginCommands },
        }));

        // add event-listener directly as the neos-ui hotkey-handling can't prevent defaults
        document.addEventListener('keydown', (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.stopPropagation();
                e.preventDefault();
                this.props.toggleCommandBar();
            }
        });
    }

    async componentDidUpdate(prevProps: CommandBarUiPluginProps) {
        if (prevProps.documentNode?.contextPath != this.props.documentNode?.contextPath) {
            addRecentDocument(this.props.documentNode.contextPath).then((recentDocuments) => {
                this.setState({ recentDocuments });
            });
        }
    }

    buildCommandsFromHotkeys = (): HierarchicalCommandList => {
        const { hotkeyRegistry, handleHotkeyAction, config } = this.props;
        const hotkeys: NeosHotKey[] = hotkeyRegistry.getAllAsList();
        return hotkeys.reduce((carry, { id, description, action }) => {
            if (!config.hotkeys.filter.includes(id)) {
                carry[id] = {
                    name: description,
                    description: id,
                    icon: this.mapHotkeyIdToIcon(id),
                    action: async () => void handleHotkeyAction(action()),
                    closeOnExecute: true,
                };
            }
            return carry;
        }, {} as HierarchicalCommandList);
    };

    buildCommandsFromWorkspaces = (): HierarchicalCommandList => {
        const { allowedTargetWorkspaces } = this.props.neos.configuration;
        return Object.keys(allowedTargetWorkspaces).reduce((carry, workspaceName) => {
            const workspace = allowedTargetWorkspaces[workspaceName];
            if (workspace.readonly) {
                return carry;
            }
            carry[workspaceName] = {
                name: workspace.title,
                description: workspace.description,
                icon: 'cube',
                action: async () => {
                    this.props.changeBaseWorkspaceAction(workspace.name);
                },
                closeOnExecute: true,
            };
            return carry;
        }, {} as HierarchicalCommandList);
    };

    buildCommandsFromEditPreviewModes = (): HierarchicalCommandList => {
        const { setEditPreviewMode, editPreviewModes, i18nRegistry } = this.props;

        return Object.keys(editPreviewModes).reduce((carry, mode) => {
            const { title, isEditingMode } = editPreviewModes[mode];
            carry[mode] = {
                name: i18nRegistry.translate(title),
                description: () =>
                    this.props.editPreviewMode === mode
                        ? this.translate('CommandBarUiPlugin.command.switchEditPreviewMode.active', 'Currently active')
                        : '',
                icon: isEditingMode ? 'pencil' : 'eye',
                action: async () => setEditPreviewMode(mode),
            };
            return carry;
        }, {} as HierarchicalCommandList);
    };

    handleAddNode = async (): AsyncCommandResult => {
        const { addNode, documentNode, focusedNodeContextPath, toggleCommandBar } = this.props;
        toggleCommandBar();
        addNode(focusedNodeContextPath || documentNode.contextPath, undefined, 'after');
    };

    showRecentDocuments = async function* (this: CommandBarUiPlugin): CommandGeneratorResult {
        const { recentDocuments } = this.state;
        const { setActiveContentCanvasContextPath, setActiveContentCanvasSrc } = this.props;

        if (!recentDocuments.length) {
            yield {
                success: false,
                message: this.translate('CommandBarUiPlugin.command.searchDocuments.searchFailed', 'Search failed'),
            };
        } else {
            yield {
                success: true,
                message: this.translate('CommandBarUiPlugin.command.recentDocuments.options', 'Recent documents'),
                options: recentDocuments.reduce((carry, { name, contextPath, uri, icon }) => {
                    carry[contextPath] = {
                        id: contextPath,
                        name,
                        icon,
                        action: async () => {
                            setActiveContentCanvasSrc(uri);
                            setActiveContentCanvasContextPath(contextPath);
                        },
                        closeOnExecute: true,
                    };
                    return carry;
                }, {} as FlatCommandList),
            };
        }
    };

    handleSearchNode = async function* (this: CommandBarUiPlugin, query: string): CommandGeneratorResult {
        const { siteNode, setActiveContentCanvasSrc } = this.props as CommandBarUiPluginProps;
        yield {
            success: true,
            message: this.translate('CommandBarUiPlugin.command.searchDocuments.searching', { query }),
        };
        let error;
        const results = await NodesApi.searchNodes(query, siteNode.contextPath).catch((e) => {
            logger.error('Could not search nodes', e);
            error = e.message;
        });
        if (!results) {
            yield {
                success: false,
                message: this.translate('CommandBarUiPlugin.command.searchDocuments.searchFailed', 'Search failed'),
                view: error,
            };
        } else {
            yield {
                success: true,
                message: this.translate('CommandBarUiPlugin.command.searchDocuments.matches', {
                    matches: results.length,
                }),
                options: results.reduce((carry, { name, nodetype, contextPath, uri, icon }) => {
                    if (!uri) {
                        // TODO: Show hint that document cannot be opened or filter them remotely already?
                        return carry;
                    }

                    carry[contextPath] = {
                        id: contextPath,
                        name,
                        category: nodetype,
                        action: async () => {
                            setActiveContentCanvasSrc(uri);
                        },
                        closeOnExecute: true,
                        icon,
                    };
                    return carry;
                }, {} as FlatCommandList),
            };
        }
    };

    handleSearchNeosDocs = async function* (this: CommandBarUiPlugin, query: string): CommandGeneratorResult {
        yield {
            success: true,
            message: this.translate(
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
                message: this.translate('CommandBarUiPlugin.command.documentation.error', 'Search failed'),
                view: error,
            };
        } else {
            yield {
                success: true,
                message: this.translate(
                    'CommandBarUiPlugin.command.documentation.matches',
                    { matches: Object.keys(options).length },
                    `${Object.values(options).length} options match your query`
                ),
                options,
            };
        }
    };

    handleSearchNeosPackages = async function* (this: CommandBarUiPlugin, query: string): CommandGeneratorResult {
        yield {
            success: true,
            message: this.translate(
                'CommandBarUiPlugin.command.packages.searching',
                { query },
                `Search for "${query}"`
            ),
        };
        let error;
        const options = await PackagesApi.searchNeosPackages(query).catch((e) => {
            logger.error('Could not search Neos packages', e);
            error = e.message;
        });
        if (error || !options) {
            yield {
                success: false,
                message: this.translate('CommandBarUiPlugin.command.packages.error', 'Search failed'),
                view: error,
            };
        } else {
            yield {
                success: true,
                message: this.translate(
                    'CommandBarUiPlugin.command.packages.matches',
                    { matches: Object.values(options).length },
                    `${Object.values(options).length} options match your query`
                ),
                options,
            };
        }
    };

    // TODO: Reimplement publishAction
    // handlePublish = async (): AsyncCommandResult => {
    //     const { publishableNodesInDocument, publishAction, baseWorkspace } = this.props;
    //     publishAction(
    //         publishableNodesInDocument.map((node) => node.contextPath),
    //         baseWorkspace
    //     );
    //     return {
    //         success: true,
    //         message: this.translate(
    //             'CommandBarUiPlugin.command.publish.success',
    //             { count: publishableNodesInDocument.length },
    //             `Published ${publishableNodesInDocument.length} changes`
    //         ),
    //     };
    // };
    //
    // handlePublishAll = async (): AsyncCommandResult => {
    //     const { publishableNodes, publishAction, baseWorkspace } = this.props;
    //     publishAction(
    //         publishableNodes.map((node) => node.contextPath),
    //         baseWorkspace
    //     );
    //     return {
    //         success: true,
    //         message: this.translate(
    //             'CommandBarUiPlugin.command.publishAll.success',
    //             { count: publishableNodes.length },
    //             `Published ${publishableNodes.length} changes`
    //         ),
    //     };
    // };

    // TODO: Reimplement discardAction
    // handleDiscard = async (): AsyncCommandResult => {
    //     const { publishableNodesInDocument, discardAction } = this.props;
    //     discardAction(publishableNodesInDocument.map((node) => node.contextPath));
    //     return {
    //         success: true,
    //         message: this.translate(
    //             'CommandBarUiPlugin.command.discard.success',
    //             { count: publishableNodesInDocument.length },
    //             `Discarded ${publishableNodesInDocument.length} changes`
    //         ),
    //     };
    // };
    //
    // handleDiscardAll = async (): AsyncCommandResult => {
    //     const { publishableNodes, discardAction } = this.props;
    //     discardAction(publishableNodes.map((node) => node.contextPath));
    //     return {
    //         success: true,
    //         message: this.translate(
    //             'CommandBarUiPlugin.command.discardAll.success',
    //             { count: publishableNodes.length },
    //             `Discarded ${publishableNodes.length} changes`
    //         ),
    //     };
    // };

    setDragging = (dragging: boolean) => {
        this.setState({ ...this.state, dragging });
    };

    translate: TranslateFunction = (id, paramsOrFallback, fallback) => {
        if (typeof paramsOrFallback === 'string') {
            fallback = paramsOrFallback;
            paramsOrFallback = {};
        }
        return this.props.i18nRegistry.translate(id, fallback, paramsOrFallback, 'Shel.Neos.CommandBar', 'Main');
    };

    render() {
        const { commandBarOpen, toggleCommandBar } = this.props as CommandBarUiPluginProps;
        const { commands, loaded, dragging, favouriteCommands, recentCommands, recentDocuments, showBranding } =
            this.state;

        return (
            <div className={classnames(styles.commandBarToolbarComponent, theme.commandBarTheme)}>
                <ToggleButton
                    handleToggle={toggleCommandBar}
                    disabled={!loaded}
                    label={this.translate('ToggleButton.label', 'Search…')}
                    title={this.translate('ToggleButton.title', 'Search for commands')}
                    active={commandBarOpen}
                />
                {loaded && (
                    <div
                        className={[styles.fullScreenLayer, commandBarOpen && styles.open].join(' ')}
                        onDragOver={(e) => e.preventDefault()}
                        style={dragging ? { pointerEvents: 'all' } : null}
                    >
                        <CommandBar
                            open={commandBarOpen}
                            commands={commands}
                            toggleOpen={toggleCommandBar}
                            onDrag={this.setDragging}
                            IconComponent={IconComponent}
                            userPreferences={{
                                favouriteCommands,
                                recentCommands,
                                recentDocuments,
                                showBranding,
                                addRecentCommand: PreferencesApi.addRecentCommand,
                                addRecentDocument: PreferencesApi.addRecentDocument,
                                setFavouriteCommands: PreferencesApi.setFavouriteCommands,
                            }}
                            translate={this.translate}
                        />
                    </div>
                )}
            </div>
        );
    }
}

const mapStateToProps = (state: NeosRootState) => ({
    siteNode: selectors.CR.Nodes.siteNodeSelector(state),
    documentNode: selectors.CR.Nodes.documentNodeSelector(state),
    focusedNodeContextPath: selectors.CR.Nodes.focusedNodePathSelector(state),
    publishableNodes: selectors.CR.Workspaces.publishableNodesSelector(state),
    publishableNodesInDocument: selectors.CR.Workspaces.publishableNodesInDocumentSelector(state),
    isWorkspaceReadOnly: selectors.CR.Workspaces.isWorkspaceReadOnlySelector(state),
    baseWorkspace: selectors.CR.Workspaces.baseWorkspaceSelector(state),
    commandBarOpen: commandBarSelectors.commandBarOpen(state),
    editPreviewMode: selectors.UI.EditPreviewMode.currentEditPreviewMode(state),
    previewUrl: commandBarSelectors.previewUrl(state),
});

const mapDispatchToProps = (dispatch) => ({
    handleHotkeyAction: dispatch,
});

const mapGlobalRegistryToProps = neos((globalRegistry: any) => ({
    i18nRegistry: globalRegistry.get('i18n'),
    hotkeyRegistry: globalRegistry.get('hotkeys'),
    config: globalRegistry.get('frontendConfiguration').get('Shel.Neos.CommandBar:CommandBar'),
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository'),
    editPreviewModes: globalRegistry.get('frontendConfiguration').get('editPreviewModes'),
    plugins: globalRegistry.get('Shel.Neos.CommandBar').getChildrenAsObject('plugins'),
}));

export default connect(() => ({}), {
    toggleCommandBar: commandBarActions.toggleCommandBar,
    addNode: actions.CR.Nodes.commenceCreation,
    setEditPreviewMode: actions.UI.EditPreviewMode.set,
    // TODO: Reimplement publishAction
    // publishAction: actions.CR.Workspaces.publish,
    // TODO: Reimplement discardAction
    //discardAction: actions.CR.Workspaces.commenceDiscard,
    setActiveContentCanvasSrc: actions.UI.ContentCanvas.setSrc,
    setActiveContentCanvasContextPath: actions.CR.Nodes.setDocumentNode,
    changeBaseWorkspaceAction: actions.CR.Workspaces.changeBaseWorkspace,
})(connect(mapStateToProps, mapDispatchToProps)(mapGlobalRegistryToProps(CommandBarUiPlugin)));
