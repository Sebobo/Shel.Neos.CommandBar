import manifest from '@neos-project/neos-ui-extensibility';

import { reducer, actions } from './actions';
import CommandBarUiWrapper from './CommandBarUiWrapper';

manifest('Shel.Neos.CommandBar:CommandBar', {}, (globalRegistry, { frontendConfiguration }) => {
    const { enabled } = frontendConfiguration['Shel.Neos.CommandBar:CommandBar'];

    if (!enabled) {
        return;
    }

    const containersRegistry = globalRegistry.get('containers');
    const hotkeyRegistry = globalRegistry.get('hotkeys');
    const reducersRegistry = globalRegistry.get('reducers');

    if (frontendConfiguration.hotkeys !== null && frontendConfiguration.hotkeys.length !== 0) {
        hotkeyRegistry.set('Shel.Neos.CommandBar.toggle', {
            description: 'Toggle command bar',
            action: actions.toggleCommandBar,
        });

        reducersRegistry.set('Shel.Neos.CommandBar', { reducer });
    }

    containersRegistry.set('PrimaryToolbar/Middle/CommandBar', CommandBarUiWrapper);
});
