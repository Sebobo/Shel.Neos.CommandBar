import * as React from 'react';
import ReactDOM from 'react-dom';
import * as retargetEvents from 'react-shadow-dom-retarget-events';

import App from './App';

/**
 * This is a custom element that is used to render the command bar inside a shadow dom to prevent Neos and module
 * styles from leaking into the component
 */
export default class CommandBarContainer extends HTMLElement {
    mountPoint: HTMLDivElement;

    createApp() {
        return React.createElement(App, {}, React.createElement('slot'));
    }

    // noinspection JSUnusedGlobalSymbols
    connectedCallback() {
        this.mountPoint = document.createElement('div');
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.appendChild(this.mountPoint);

        const style = document.createElement('link');
        style.setAttribute('rel', 'stylesheet');
        style.setAttribute('href', this.getAttribute('styleuri'));
        shadowRoot.append(style);

        ReactDOM.render(this.createApp(), this.mountPoint);
        // Make React events work with shadow dom
        retargetEvents(shadowRoot);
    }
}
