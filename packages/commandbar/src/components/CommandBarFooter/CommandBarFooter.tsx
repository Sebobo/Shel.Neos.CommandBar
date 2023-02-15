import React from 'react';

import { useCommandBarState } from '../../state';

import * as styles from './CommandBarFooter.module.css';
import IconWrapper from '../IconWrapper/IconWrapper';

const CommandBarFooter: React.FC = () => {
    const {
        state: { activeCommandId, activeCommandMessage, commands, result, selectedCommandGroup, expanded },
        Icon,
    } = useCommandBarState();

    if (!expanded) return null;

    const runningCommand = activeCommandId ? commands[activeCommandId] ?? result.options[activeCommandId] : null;

    return (
        <footer className={styles.commandBarFooter}>
            {activeCommandId ? (
                <span className={styles.activity}>
                    <IconWrapper>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <path
                                fill="currentColor"
                                d="M288 39.056v16.659c0 10.804 7.281 20.159 17.686 23.066C383.204 100.434 440 171.518 440 256c0 101.689-82.295 184-184 184-101.689 0-184-82.295-184-184 0-84.47 56.786-155.564 134.312-177.219C216.719 75.874 224 66.517 224 55.712V39.064c0-15.709-14.834-27.153-30.046-23.234C86.603 43.482 7.394 141.206 8.003 257.332c.72 137.052 111.477 246.956 248.531 246.667C393.255 503.711 504 392.788 504 256c0-115.633-79.14-212.779-186.211-240.236C302.678 11.889 288 23.456 288 39.056z"
                            />
                        </svg>
                    </IconWrapper>
                    <em>
                        {runningCommand.name} ‒ {activeCommandMessage}
                    </em>
                </span>
            ) : selectedCommandGroup ? (
                <span className={styles.breadcrumb}>
                    <Icon icon={commands[selectedCommandGroup].icon} />
                    <small>{commands[selectedCommandGroup].name}</small>
                </span>
            ) : (
                <IconWrapper>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path
                            fill="currentColor"
                            d="M415.44 512h-95.11L212.12 357.46v91.1L125.69 512H28V29.82L68.47 0h108.05l123.74 176.13V63.45L386.69 0h97.69v461.5zM38.77 35.27V496l72-52.88V194l215.5 307.64h84.79l52.35-38.17h-78.27L69 13zm82.54 466.61 80-58.78v-101l-79.76-114.4v220.94L49 501.89h72.34zM80.63 10.77l310.6 442.57h82.37V10.77h-79.75v317.56L170.91 10.77zM311 191.65l72 102.81V15.93l-72 53v122.72z"
                        />
                    </svg>
                </IconWrapper>
            )}
            <a
                href="https://helzle.it"
                title="Made with love by Sebastian Helzle"
                target="_blank"
                rel="noreferrer noopener"
                className={styles.madeWithLove}
            >
                <small>Made with love by</small>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 180 180">
                    <defs>
                        <linearGradient
                            id="a"
                            gradientUnits="userSpaceOnUse"
                            x1="280.25"
                            y1="377.003"
                            x2="373.261"
                            y2="377.003"
                        >
                            <stop offset="0" stopColor="#297AAC" />
                            <stop offset="1" stopColor="#53AADA" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0 180.017h37.287L71.35 52.898H34.061zM48.717 0l-9.083 33.898h36.675L85.392 0z"
                        fill="#B9B7B3"
                    />
                    <path
                        d="M335.972 313.444H288.25l-8 28.306h47.691l-28.03 98.813h39.287l34.063-127.119z"
                        fill="url(#a)"
                        transform="translate(-195.462 -260.325)"
                    />
                </svg>
            </a>
        </footer>
    );
};

export default CommandBarFooter;
