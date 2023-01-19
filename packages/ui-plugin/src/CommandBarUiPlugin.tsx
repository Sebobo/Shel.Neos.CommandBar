import * as React from 'react';
import { connect, DefaultRootState } from 'react-redux';
import PropTypes from 'prop-types';
import { IconButton } from '@neos-project/react-ui-components';

// Neos dependencies are provided by the UI
// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';
// @ts-ignore
import { selectors, actions } from '@neos-project/neos-ui-redux-store';

import CommandBar from '@neos-commandbar/commandbar';
import { actions as commandBarActions, selectors as commandBarSelectors } from './actions';
import * as styles from './CommandBarUiPlugin.module.css';
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
};

type CommandBarUiPluginState = {
    loaded: boolean;
    commands: HierarchicalCommandList;
};

const ENDPOINT_COMMANDS = 'service/data-source/shel-neos-commandbar-commands';
const ENDPOINT_SEARCH_NODES = 'service/data-source/shel-neos-commandbar-search-nodes';

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
            commands: {
                testAsync: {
                    name: 'Test async',
                    icon: 'vial',
                    description: 'Wait and return a debug message',
                    action: async () => {
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        return {
                            success: true,
                            message: 'Debug message',
                        };
                    },
                },
                testGenerator: {
                    name: 'Test generator',
                    icon: 'vial',
                    description: 'Wait and return iterate on command results',
                    action: async function* () {
                        yield {
                            success: true,
                            message: 'Doing some testing step 1',
                        };
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        yield {
                            success: true,
                            message: 'Doing some more testing step 2',
                        };
                        await new Promise((resolve) => setTimeout(resolve, 2000));
                        return {
                            success: true,
                            message: 'Finished testing',
                        };
                    },
                },
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

    componentDidMount() {
        // TODO: Load additional commands from datasource
        fetchData(ENDPOINT_COMMANDS)
            .then((commands: ModuleCommands) => {
                this.setState((prev) => ({ loaded: true, commands: { ...prev.commands, ...commands } }));
                console.debug('Loaded commands', commands, this.state.commands);
            })
            .catch((error) => {
                console.error('Failed to load commands', error);
            });

        window.addEventListener('keypress', (e) => {
            console.debug('keypress on window', e);
        });

        const guestFrame = document.getElementsByName('neos-content-main')[0] as HTMLIFrameElement;
        guestFrame.contentWindow?.addEventListener('keypress', (e) => {
            console.debug('keypress in guestframe', e);
        });
        console.debug('guestFrame', guestFrame.contentWindow);
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
        const { editPreviewMode, setEditPreviewMode, editPreviewModes, i18nRegistry } = this.props;

        return Object.keys(editPreviewModes).reduce((carry, mode) => {
            const { title, isEditingMode } = editPreviewModes[mode];
            carry[mode] = {
                name: i18nRegistry.translate(title),
                description: editPreviewMode === mode ? 'Currently active' : '',
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
        const { siteNode, setActiveContentCanvasContextPath, setActiveContentCanvasSrc } = this.props as CommandBarUiPluginProps;
        yield {
            success: true,
            message: `Searching for "${query}"`,
        };
        const results = (await fetchData(ENDPOINT_SEARCH_NODES, { query, node: siteNode.contextPath }).then(
            (results) => {
                // TODO: Check results
                console.debug('Search result', results);
                return results;
            }
        )) as SearchNodeResult[];
        yield {
            success: true,
            message: `${results.length} results match your query`,
            options: results.reduce((carry, { name, nodetype, icon, contextPath, uri }) => {
                if (!uri) {
                    // TODO: Show hint that document cannot be opened?
                    return carry;
                }

                carry[contextPath] = {
                    id: contextPath,
                    name,
                    description: nodetype,
                    action: async () => {
                        console.debug('Search result selected', contextPath, uri);
                        setActiveContentCanvasSrc(uri);
                        setActiveContentCanvasContextPath(contextPath);
                    },
                    icon,
                };
                return carry;
            }, {} as FlatCommandList),
        };
        // TODO: Show selectable results
        return {
            success: true,
            message: 'Finished searching',
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

    render() {
        const { commandBarOpen, toggleCommandBar } = this.props as CommandBarUiPluginProps;
        const { commands, loaded } = this.state;

        return (
            <div>
                <IconButton
                    onClick={() => toggleCommandBar()}
                    isActive={commandBarOpen}
                    title="Toggle command bar"
                    icon="search"
                    disabled={!loaded}
                />
                {loaded && (
                    <div className={[styles.fullScreenLayer, commandBarOpen && styles.open].join(' ')}>
                        <CommandBar open={commandBarOpen} commands={commands} toggleOpen={toggleCommandBar} />
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
