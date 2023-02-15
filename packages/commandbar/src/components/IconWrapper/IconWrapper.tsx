import React from 'react';

import * as styles from './IconWrapper.module.css';

type IconWrapperProps = {
    children: JSX.Element;
};

const IconWrapper: React.FC<IconWrapperProps> = ({ children }) => {
    return <span className={styles.iconWrap}>{children}</span>;
};

export default React.memo(IconWrapper);
