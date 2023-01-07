import * as React from 'react';
import { Icon as NeosIcon } from '@neos-project/react-ui-components';

import * as styles from './Icon.module.css';

type IconProps = {
    icon: string;
};

const Icon: React.FC<IconProps> = ({ icon }) => {
    return (
        <span className={styles.iconWrap}>
            <NeosIcon icon={icon} />
        </span>
    );
};

export default React.memo(Icon);
