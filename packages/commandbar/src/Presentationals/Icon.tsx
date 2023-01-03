import * as React from 'react';

import * as styles from './Icon.module.scss';

type IconProps = {
    icon: string;
    type?: string;
};

const Icon: React.FC<IconProps> = ({ icon, type = 'fas' }) => {
    return (
        <span className={styles.iconWrap}>
            <span className={`${type} fa-${icon || 'question'}`}></span>
        </span>
    );
};

export default React.memo(Icon);
