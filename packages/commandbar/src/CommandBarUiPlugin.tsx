import * as React from 'react';
import { connect, DefaultRootState } from 'react-redux';
import PropTypes from 'prop-types';
import { IconButton } from '@neos-project/react-ui-components';

// Neos dependencies are provided by the UI
// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';
// @ts-ignore
import { selectors, actions } from '@neos-project/neos-ui-redux-store';

import CommandBar from './CommandBar';
import { actions as commandBarActions, selectors as commandBarSelectors } from './actions';
import * as styles from './CommandBarUiPlugin.module.css';
import fetchCommands from './helpers/fetchCommands';

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
};

type CommandBarUiPluginState = {
    loaded: boolean;
    commands: CommandList;
};

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
    };

    constructor(props) {
        super(props);
        this.state = {
            loaded: false,
            commands: {
                debug: {
                    name: 'Debug',
                    icon: 'vial',
                    description: 'Write a debug message',
                    action: () => console.debug('Debug debug'),
                },
                addNode: {
                    name: 'Add node',
                    icon: 'plus',
                    description: 'Add a new node',
                    action: this.handleAddNode,
                },
                searchDocument: {
                    name: 'Search document',
                    icon: 'search',
                    description: 'Search for a document',
                    action: this.handleSearchNode,
                    canHandleQueries: true,
                },
                publicDiscard: {
                    name: 'Publish or discard changes',
                    description: 'Publish or discard changes',
                    icon: 'check',
                    children: {
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
                    icon: 'neos',
                    description: 'Execute configured hotkeys',
                    children: this.buildCommandsFromHotkeys(),
                },
                switchEditPreviewMode: {
                    name: 'Switch edit/preview mode',
                    icon: 'pencil',
                    description: 'Switch between edit and preview modes',
                    children: this.buildCommandsFromEditPreviewModes(),
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
        fetchCommands('service/data-source/shel-neos-commandbar')
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
    }

    buildCommandsFromHotkeys = (): CommandList => {
        const { hotkeyRegistry, handleHotkeyAction, config } = this.props;
        const hotkeys: NeosHotKey[] = hotkeyRegistry.getAllAsList();
        return hotkeys.reduce((carry, { id, description, action }) => {
            if (!config.hotkeys.filter.includes(id)) {
                carry[id] = {
                    name: description,
                    description: id,
                    icon: this.mapHotkeyIdToIcon(id),
                    action: () => handleHotkeyAction(action()),
                };
            }
            return carry;
        }, {});
    };

    buildCommandsFromEditPreviewModes = (): CommandList => {
        const { editPreviewMode, setEditPreviewMode, editPreviewModes, i18nRegistry } = this.props;

        return Object.keys(editPreviewModes).reduce((carry, mode) => {
            const { title, isEditingMode } = editPreviewModes[mode];
            carry[mode] = {
                name: i18nRegistry.translate(title),
                description: editPreviewMode === mode ? 'Currently active' : '',
                icon: isEditingMode ? 'pencil' : 'eye',
                action: () => setEditPreviewMode(mode),
            };
            return carry;
        }, {});
    };

    handleAddNode = () => {
        const { addNode, documentNode, focusedNodeContextPath, toggleCommandBar } = this.props;
        toggleCommandBar();
        addNode(focusedNodeContextPath || documentNode.contextPath, undefined, 'after');
    };

    handleSearchNode = (searchQuery: string) => {
        console.debug('Search for', searchQuery);
        // TODO: Implement search and return results
    };

    handlePublish = () => {
        const { publishableNodesInDocument, publishAction, baseWorkspace } = this.props;
        publishAction(
            publishableNodesInDocument.map((node) => node.contextPath),
            baseWorkspace
        );
    };

    handlePublishAll = () => {
        const { publishableNodes, publishAction, baseWorkspace } = this.props;
        publishAction(
            publishableNodes.map((node) => node.contextPath),
            baseWorkspace
        );
    };

    handleDiscard = () => {
        const { publishableNodesInDocument, discardAction } = this.props;
        discardAction(publishableNodesInDocument.map((node) => node.contextPath));
    };

    handleDiscardAll = () => {
        const { publishableNodes, discardAction } = this.props;
        discardAction(publishableNodes.map((node) => node.contextPath));
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
})(connect(mapStateToProps, mapDispatchToProps)(mapGlobalRegistryToProps(CommandBarUiPlugin)));