import React from 'react';
import * as styles from './ModulePlugin.module.css';

/**
 * As we don't have font awesome in the shadow dom, we need to render a fallback icon for commands
 */
const IconComponent: React.FC<IconProps> = ({ icon, spin = false }) => {
    return (
        <svg className={spin ? styles.spin : ''} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path
                fill="currentColor"
                d="M509.5 184.6 458.9 32.8C452.4 13.2 434.1 0 413.4 0H272v192h238.7c-.4-2.5-.4-5-1.2-7.4zM240 0H98.6c-20.7 0-39 13.2-45.5 32.8L2.5 184.6c-.8 2.4-.8 4.9-1.2 7.4H240V0zM0 224v240c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V224H0z"
            />
        </svg>
    );
};

export default IconComponent;
