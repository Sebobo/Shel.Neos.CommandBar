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
};

class CommandBarUiWrapper extends React.PureComponent<CommandBarUiWrapperProps> {
    static propTypes = {
        i18nRegistry: PropTypes.object.isRequired,
        siteNode: PropTypes.object,
        documentNode: PropTypes.object,
        focusedNodes: PropTypes.array,
        commandBarOpen: PropTypes.bool,
        toggleCommandBar: PropTypes.func,
    };

    render() {
        const { commandBarOpen, toggleCommandBar } = this.props as CommandBarUiWrapperProps;

        const commands = {
            home: {
                icon: 'home',
                name: 'Home',
                description: 'Sends you home',
                action: () => console.debug('Go home'),
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

const mapDispatchToProps = () => ({ handleServerFeedback: actions.ServerFeedback.handleServerFeedback });

const mapGlobalRegistryToProps = neos((globalRegistry: any) => ({
    i18nRegistry: globalRegistry.get('i18n'),
    config: globalRegistry.get('frontendConfiguration').get('Shel.Neos.Terminal:Terminal'),
}));

export default connect(() => ({}), { toggleCommandBar: commandBarActions.toggleCommandBar })(
    connect(mapStateToProps, mapDispatchToProps)(mapGlobalRegistryToProps(CommandBarUiWrapper))
);
