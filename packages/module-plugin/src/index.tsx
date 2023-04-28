import register from 'preact-custom-element';

import App from './App';

// @ts-ignore
if (process.env.NODE_ENV !== 'production') {
    // @ts-ignore
    require('preact/debug');
}

function initializeApp() {
    // Prevent registering the custom element twice
    if (window['SHEL_NEOS_COMMANDBAR_INITIALIZED']) return;
    window['SHEL_NEOS_COMMANDBAR_INITIALIZED'] = true;

    // Register & add the debug web component, tagName and attributes are automatically read from the component
    register(App, null, null, App.options);

    // Get the top bar left container and create a custom element to render the command bar into
    const topBarLeft = document.querySelector('.neos-top-bar-left');
    const pluginContainer = document.createElement('command-bar-container');
    pluginContainer.id = 'shel-neos-commandbar';

    // Get the style tag of the command bar package from the HTML head to also load it inside the custom element
    const commandBarStyleTag = document.querySelector(
        'link[rel="stylesheet"][href*="Shel.Neos.CommandBar"]'
    ) as HTMLLinkElement;
    pluginContainer.setAttribute('styleuri', commandBarStyleTag.href);

    topBarLeft.appendChild(pluginContainer);
}

// If the api is already initialized, initialize the app as the event listener wouldn't be called anymore
if (window.NeosCMS?.I18n?.initialized) {
    initializeApp();
} else {
    window.addEventListener('neoscms-i18n-initialized', initializeApp);
}
