import manifest, { SynchronousRegistry } from '@neos-project/neos-ui-extensibility';
import { selectors } from '@neos-project/neos-ui-redux-store';

import { reducer, actions } from './actions';
import CommandBarUiPlugin from './CommandBarUiPlugin';

manifest('Shel.Neos.CommandBar:CommandBar', {}, (globalRegistry, { store, frontendConfiguration }) => {
    /** @type {{ enabled: boolean, features: { loadTestCommands: boolean } }} pluginConfig */
    const pluginConfig = frontendConfiguration['Shel.Neos.CommandBar:CommandBar'];
    const { enabled, features } = pluginConfig;

    if (!enabled) {
        return;
    }

    // Create our new registry for 3rd party command bar plugins
    globalRegistry.set(
        'Shel.Neos.CommandBar',
        new SynchronousRegistry(`
        # Shel.Neos.CommandBar 3rd party commands
    `)
    );

    // Register test plugin command
    if (features.loadTestCommands) {
        globalRegistry.get('Shel.Neos.CommandBar').set('plugins/test', () => ({
            extensibilityTest: {
                name: 'Extensibility test',
                icon: 'vial',
                description: 'Command registered via command bar extensibility',
                canHandleQueries: true,
                action: async (query) => {
                    const state = store.getState();
                    const documentNode = selectors.CR.Nodes.documentNodeSelector(state);
                    window.alert(`The current document node is ${documentNode.contextPath} and the query is ${query}.`);
                },
            },
        }));
    }

    // Register commandbar component in the primary toolbar
    globalRegistry.get('containers').set('PrimaryToolbar/Middle/CommandBar', CommandBarUiPlugin);

    // Register reducer
    globalRegistry.get('reducers').set('Shel.Neos.CommandBar', { reducer });

    // Register hotkeys
    if (frontendConfiguration.hotkeys !== null && frontendConfiguration.hotkeys.length !== 0) {
        const hotkeyRegistry = globalRegistry.get('hotkeys');
        hotkeyRegistry.set('Shel.Neos.CommandBar.toggle.CMD', {
            description: 'Toggle command bar',
            action: actions.toggleCommandBar,
        });
        hotkeyRegistry.set('Shel.Neos.CommandBar.toggle.CTRL', {
            description: 'Toggle command bar',
            action: actions.toggleCommandBar,
        });
    }
});
