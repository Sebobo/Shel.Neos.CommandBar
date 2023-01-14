import * as React from 'react';

// import iconMapper from '@neos-project/react-ui-components/src/Icon/mapper';
import { Icon as NeosIcon } from '@neos-project/react-ui-components';

import * as styles from './Icon.module.css';

type IconProps = {
    icon: string;
    spin?: boolean;
};

const Icon: React.FC<IconProps> = ({ icon, spin = false }) => {
    return (
        <span className={styles.iconWrap}>
            <NeosIcon icon={icon} spin={spin} />
        </span>
    );
};

export default React.memo(Icon);
