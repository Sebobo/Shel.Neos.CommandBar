import manifest from '@neos-project/neos-ui-extensibility';

import { reducer, actions } from './actions';
import CommandBarUiPlugin from './CommandBarUiPlugin';

manifest('Shel.Neos.CommandBar:CommandBar', {}, (globalRegistry, { frontendConfiguration }) => {
    const { enabled } = frontendConfiguration['Shel.Neos.CommandBar:CommandBar'];

    if (!enabled) {
        return;
    }

    globalRegistry.get('containers').set('PrimaryToolbar/Middle/CommandBar', CommandBarUiPlugin);
    globalRegistry.get('reducers').set('Shel.Neos.CommandBar', { reducer });

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
