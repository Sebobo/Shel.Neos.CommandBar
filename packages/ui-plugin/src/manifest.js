import manifest, { SynchronousRegistry } from '@neos-project/neos-ui-extensibility';

import { reducer } from './actions';
import CommandBarUiPlugin from './CommandBarUiPlugin';

manifest('Shel.Neos.CommandBar:CommandBar', {}, (globalRegistry, { frontendConfiguration }) => {
    /** @type {{ enabled: boolean, features: { loadTestCommands: boolean } }} pluginConfig */
    const pluginConfig = frontendConfiguration['Shel.Neos.CommandBar:CommandBar'];
    const { enabled } = pluginConfig;

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

    // Register commandbar component in the primary toolbar
    globalRegistry.get('containers').set('PrimaryToolbar/Middle/CommandBar', CommandBarUiPlugin);

    // Register reducer
    globalRegistry.get('reducers').set('Shel.Neos.CommandBar', { reducer });
});
