import React from 'react';
import { useCommandBarState } from '../../state';

import * as styles from './Branding.module.css';

const Branding: React.FC = () => {
    const {
        state: { showBranding },
    } = useCommandBarState();

    if (!showBranding) return null;

    return (
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
    );
};

export default Branding;
