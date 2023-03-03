import * as React from 'react';
import { connect, DefaultRootState } from 'react-redux';
import PropTypes from 'prop-types';

// Neos dependencies are provided by the UI
// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';
// @ts-ignore
import { selectors, actions } from '@neos-project/neos-ui-redux-store';
import { Icon } from '@neos-project/react-ui-components';

import * as styles from './CommandBarUiPlugin.module.css';
import { CommandBar, logger, ToggleButton } from '@neos-commandbar/commandbar';
import { actions as commandBarActions, selectors as commandBarSelectors } from './actions';
import fetchData from './helpers/fetchData';

type CommandBarUiPluginProps = {
    config: CommandBarConfig;
    siteNode: CRNode;
    documentNode: CRNode;
    focusedNodeContextPath: string;
    i18nRegistry: I18nRegistry;
    commandBarOpen: boolean;
    toggleCommandBar: () => void;
    hotkeyRegistry: any;
    handleHotkeyAction: (action: () => any) => void;
    addNode: (
        referenceNodeContextPath: string,
        referenceNodeFusionPath: string | null,
        preferredMode: string,
        nodeType?: string
    ) => void;
    editPreviewMode: string;
    setEditPreviewMode: (mode: string) => void;
    editPreviewModes: EditPreviewModes;
    publishableNodes: CRNode[];
    publishableNodesInDocument: CRNode[];
    isWorkspaceReadOnly: boolean;
    publishAction: (contextPaths: string[], baseWorkspace: string) => void;
    discardAction: (contextPaths: string[]) => void;
    baseWorkspace: string;
    setActiveContentCanvasContextPath: (contextPath: string) => void;
    setActiveContentCanvasSrc: (uri: string) => void;
    plugins: Record<string, () => HierarchicalCommandList>;
};

type CommandBarUiPluginState = {
    loaded: boolean;
    dragging: boolean;
    favouriteCommands: CommandId[];
    recentCommands: CommandId[];
    recentDocuments: NodeContextPath[];
    showBranding: boolean;
    commands: HierarchicalCommandList;
};

const ENDPOINT_COMMANDS = 'service/data-source/shel-neos-commandbar-commands';
const ENDPOINT_SEARCH_NODES = 'service/data-source/shel-neos-commandbar-search-nodes';
const ENDPOINT_SEARCH_NEOS_DOCS = 'service/data-source/shel-neos-commandbar-search-neos-docs';
const ENDPOINT_GET_PREFERENCES = '/neos/shel-neos-commandbar/preferences/getpreferences';
const ENDPOINT_SET_FAVOURITE_COMMANDS = '/neos/shel-neos-commandbar/preferences/setfavourites';
const ENDPOINT_ADD_RECENT_COMMAND = '/neos/shel-neos-commandbar/preferences/addrecentcommand';

const IconComponent: React.FC<IconProps> = ({ icon, spin = false }) => <Icon icon={icon} spin={spin} />;

class CommandBarUiPlugin extends React.PureComponent<CommandBarUiPluginProps, CommandBarUiPluginState> {
    static propTypes = {
        config: PropTypes.object.isRequired,
        i18nRegistry: PropTypes.object.isRequired,
        siteNode: PropTypes.object,
        documentNode: PropTypes.object,
        focusedNodeContextPath: PropTypes.string,
        commandBarOpen: PropTypes.bool,
        toggleCommandBar: PropTypes.func.isRequired,
        handleHotkeyAction: PropTypes.func.isRequired,
        hotkeyRegistry: PropTypes.object.isRequired,
        addNode: PropTypes.func.isRequired,
        editPreviewMode: PropTypes.string.isRequired,
        setEditPreviewMode: PropTypes.func.isRequired,
        editPreviewModes: PropTypes.object.isRequired,
        publishableNodes: PropTypes.array,
        publishableNodesInDocument: PropTypes.array,
        isWorkspaceReadOnly: PropTypes.bool,
        publishAction: PropTypes.func.isRequired,
        discardAction: PropTypes.func.isRequired,
        baseWorkspace: PropTypes.string.isRequired,
        setActiveContentCanvasContextPath: PropTypes.func.isRequired,
        setActiveContentCanvasSrc: PropTypes.func.isRequired,
    };

    constructor(props) {
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
                    name: 'Add node',
                    icon: 'plus',
                    description: 'Add a new node',
                    action: this.handleAddNode,
                },
                searchDocuments: {
                    name: 'Search documents',
                    icon: 'search',
                    description: 'Search and navigate to documents',
                    action: this.handleSearchNode.bind(this),
                    canHandleQueries: true,
                },
                publishDiscard: {
                    name: 'Publish or discard changes',
                    description: 'Publish or discard changes',
                    icon: 'check',
                    subCommands: {
                        publish: {
                            name: 'Publish',
                            description: 'Publish changes on this document',
                            icon: 'check',
                            action: this.handlePublish,
                        },
                        publishAll: {
                            name: 'Publish all',
                            description: 'Publish all changes',
                            icon: 'check-double',
                            action: this.handlePublishAll,
                        },
                        discard: {
                            name: 'Discard',
                            description: 'Discard changes on this document',
                            icon: 'ban',
                            action: this.handleDiscard,
                        },
                        discardAll: {
                            name: 'Discard all',
                            description: 'Discard all changes',
                            icon: 'ban',
                            action: this.handleDiscardAll,
                        },
                    },
                },
                quickActions: {
                    name: 'Quick actions',
                    icon: 'keyboard',
                    description: 'Execute configured hotkeys',
                    subCommands: this.buildCommandsFromHotkeys(),
                },
                switchEditPreviewMode: {
                    name: 'Switch edit/preview mode',
                    icon: 'pencil',
                    description: 'Switch between edit and preview modes',
                    subCommands: this.buildCommandsFromEditPreviewModes(),
                },
                neosDocs: {
                    name: 'Documentation',
                    icon: 'book',
                    description: 'Browse or search the Neos documentation',
                    canHandleQueries: true,
                    action: this.handleSearchNeosDocs.bind(this),
                },
            },
        };
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
            Object.keys(plugins).forEach((pluginName) => {
                try {
                    pluginCommands = { ...pluginCommands, ...plugins[pluginName]() };
                } catch (e) {
                    logger.error(`Could not load commands from plugin ${pluginName}`, e);
                }
            });
        }

        // Load commands from data source which are not available via the UI API
        const commands = await fetchData<ModuleCommands>(ENDPOINT_COMMANDS).catch((error) => {
            logger.error('Failed to load commands', error);
        });

        // Load user preferences
        const preferences = await fetchData<UserPreferences>(ENDPOINT_GET_PREFERENCES).catch((error) => {
            logger.error('Failed to load user preferences', error);
        });

        if (!preferences || !commands) return;

        this.setState((prev) => ({
            loaded: true,
            ...preferences,
            commands: { ...prev.commands, ...commands, ...pluginCommands },
        }));
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
                    action: async () => handleHotkeyAction(action()),
                };
            }
            return carry;
        }, {});
    };

    buildCommandsFromEditPreviewModes = (): HierarchicalCommandList => {
        const { setEditPreviewMode, editPreviewModes, i18nRegistry } = this.props;

        return Object.keys(editPreviewModes).reduce((carry, mode) => {
            const { title, isEditingMode } = editPreviewModes[mode];
            carry[mode] = {
                name: i18nRegistry.translate(title),
                description: () => (this.props.editPreviewMode === mode ? 'Currently active' : ''),
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

    handleSearchNode = async function* (query: string): CommandGeneratorResult {
        const { siteNode, setActiveContentCanvasContextPath, setActiveContentCanvasSrc } = this
            .props as CommandBarUiPluginProps;
        yield {
            success: true,
            message: `Searching for "${query}"`,
        };
        const results = (await fetchData(ENDPOINT_SEARCH_NODES, {
            query,
            node: siteNode.contextPath,
        })) as SearchNodeResult[];
        yield {
            success: true,
            message: `${results.length} options match your query`,
            // TODO: Already provide commands in the response so we only have to adjust the action
            options: results.reduce((carry, { name, nodetype, icon, contextPath, uri }) => {
                if (!uri) {
                    // TODO: Show hint that document cannot be opened?
                    return carry;
                }

                carry[contextPath] = {
                    id: contextPath,
                    name,
                    category: nodetype,
                    action: async () => {
                        setActiveContentCanvasSrc(uri);
                        setActiveContentCanvasContextPath(contextPath);
                    },
                    icon,
                };
                return carry;
            }, {} as FlatCommandList),
        };
        return {
            success: true,
            message: 'Finished search',
        };
    };

    handleSearchNeosDocs = async function* (query: string): CommandGeneratorResult {
        yield {
            success: true,
            message: `Searching for "${query}"`,
        };
        const results = (await fetchData(ENDPOINT_SEARCH_NEOS_DOCS, { query })) as Command[];
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

    handlePublish = async (): AsyncCommandResult => {
        const { publishableNodesInDocument, publishAction, baseWorkspace } = this.props;
        publishAction(
            publishableNodesInDocument.map((node) => node.contextPath),
            baseWorkspace
        );
        return {
            success: true,
            message: `Published ${publishableNodesInDocument.length} changes`,
        };
    };

    handlePublishAll = async (): AsyncCommandResult => {
        const { publishableNodes, publishAction, baseWorkspace } = this.props;
        publishAction(
            publishableNodes.map((node) => node.contextPath),
            baseWorkspace
        );
        return {
            success: true,
            message: `Published ${publishableNodes.length} changes`,
        };
    };

    handleDiscard = async (): AsyncCommandResult => {
        const { publishableNodesInDocument, discardAction } = this.props;
        discardAction(publishableNodesInDocument.map((node) => node.contextPath));
        return {
            success: true,
            message: `Discarded ${publishableNodesInDocument.length} changes`,
        };
    };

    handleDiscardAll = async (): AsyncCommandResult => {
        const { publishableNodes, discardAction } = this.props;
        discardAction(publishableNodes.map((node) => node.contextPath));
        return {
            success: true,
            message: `Discarded ${publishableNodes.length} changes`,
        };
    };

    setDragging = (dragging: boolean) => {
        this.setState({ ...this.state, dragging });
    };

    private static async setFavouriteCommands(commandIds: CommandId[]) {
        return fetchData(ENDPOINT_SET_FAVOURITE_COMMANDS, { commandIds }, 'POST');
    }

    private static async addRecentCommand(commandId: CommandId) {
        // TODO: Check if sendBeacon is a better option here to reduce the impact on the user
        return fetchData(ENDPOINT_ADD_RECENT_COMMAND, { commandId }, 'POST');
    }

    translate = (id: string, label = '', args = []): string => {
        return this.props.i18nRegistry.translate(id, label, args, 'Shel.Neos.CommandBar', 'Main');
    };

    render() {
        const { commandBarOpen, toggleCommandBar } = this.props as CommandBarUiPluginProps;
        const { commands, loaded, dragging, favouriteCommands, recentCommands, recentDocuments, showBranding } =
            this.state;

        return (
            <div className={styles.commandBarToolbarComponent}>
                <ToggleButton handleToggle={toggleCommandBar} disabled={!loaded} />
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
                                addRecentCommand: CommandBarUiPlugin.addRecentCommand,
                                setFavouriteCommands: CommandBarUiPlugin.setFavouriteCommands,
                            }}
                            translate={this.translate}
                        />
                    </div>
                )}
            </div>
        );
    }
}

interface NeosRootState extends DefaultRootState {
    user?: {
        name?: string;
    };
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
    publishAction: actions.CR.Workspaces.publish,
    discardAction: actions.CR.Workspaces.commenceDiscard,
    setActiveContentCanvasContextPath: actions.CR.Nodes.setDocumentNode,
    setActiveContentCanvasSrc: actions.UI.ContentCanvas.setSrc,
})(connect(mapStateToProps, mapDispatchToProps)(mapGlobalRegistryToProps(CommandBarUiPlugin)));
