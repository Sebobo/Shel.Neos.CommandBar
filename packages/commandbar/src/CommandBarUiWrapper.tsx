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
import * as styles from './CommandBarUiWrapper.module.css';

type CommandBarUiWrapperProps = {
    siteNode: Node;
    documentNode: Node;
    focusedNodes: string[];
    i18nRegistry: I18nRegistry;
    commandBarOpen: boolean;
    toggleCommandBar: () => void;
    hotkeyRegistry: any;
    handleHotkeyAction: (action: () => any) => void;
};

class CommandBarUiWrapper extends React.PureComponent<CommandBarUiWrapperProps> {
    static propTypes = {
        i18nRegistry: PropTypes.object.isRequired,
        siteNode: PropTypes.object,
        documentNode: PropTypes.object,
        focusedNodes: PropTypes.array,
        commandBarOpen: PropTypes.bool,
        toggleCommandBar: PropTypes.func,
        handleHotkeyAction: PropTypes.func,
        hotkeyRegistry: PropTypes.object,
    };

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

    buildCommandsFromHotkeys = (): CommandList => {
        const { hotkeyRegistry, handleHotkeyAction } = this.props;
        const hotkeys: NeosHotKey[] = hotkeyRegistry.getAllAsList();
        // TODO: Allow filtering of hotkeys by context/settings as some hotkeys are not relevant in the command bar
        return hotkeys.reduce((carry, { id, description, action }) => {
            carry[id] = {
                name: description,
                description: id,
                icon: this.mapHotkeyIdToIcon(id),
                action: () => handleHotkeyAction(action()),
            };
            return carry;
        }, {});
    };

    render() {
        const { commandBarOpen, toggleCommandBar } = this.props as CommandBarUiWrapperProps;

        const commands = {
            debug: {
                name: 'Debug',
                icon: 'vial',
                description: 'Write a debug message',
                action: () => console.debug('Debug debug'),
            },
            quickActions: {
                name: 'Quick actions',
                icon: 'neos',
                description: 'Execute configured hotkeys',
                children: this.buildCommandsFromHotkeys(),
            },
        };

        return (
            <div>
                <IconButton
                    onClick={() => toggleCommandBar()}
                    isActive={commandBarOpen}
                    title="Toggle command bar"
                    icon="search"
                />
                <div className={[styles.fullScreenLayer, commandBarOpen && styles.open].join(' ')}>
                    <CommandBar open={commandBarOpen} commands={commands} toggleOpen={toggleCommandBar} />
                </div>
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
    focusedNodes: selectors.CR.Nodes.focusedNodePathsSelector(state),
    commandBarOpen: commandBarSelectors.commandBarOpen(state),
});

const mapDispatchToProps = (dispatch) => ({
    handleServerFeedback: actions.ServerFeedback.handleServerFeedback,
    handleHotkeyAction: dispatch,
});

const mapGlobalRegistryToProps = neos((globalRegistry: any) => ({
    i18nRegistry: globalRegistry.get('i18n'),
    hotkeyRegistry: globalRegistry.get('hotkeys'),
    config: globalRegistry.get('frontendConfiguration').get('Shel.Neos.CommandBar:CommandBar'),
}));

export default connect(() => ({}), { toggleCommandBar: commandBarActions.toggleCommandBar })(
    connect(mapStateToProps, mapDispatchToProps)(mapGlobalRegistryToProps(CommandBarUiWrapper))
);
