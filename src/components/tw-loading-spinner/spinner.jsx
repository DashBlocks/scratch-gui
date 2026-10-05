import React from 'react';
import * as styles from './spinner.css';

const Loading = () => (
    <div className={styles.container}>
        <div className={styles.spinner} />
    </div>
);

export default Loading;
