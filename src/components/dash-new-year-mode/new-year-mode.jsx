import React, { useState, useEffect } from 'react';
import styles from './new-year-mode.css';

const isNewYearMode = () => {
    /* const now = new Date();
    return (now.getMonth() === 11 && now.getDate() >= 1) || (now.getMonth() === 0 && now.getDate() <= 10); */
    const isEnabled = new URLSearchParams(window.location.search).has('newYearMode');
    return isEnabled;
};

const NewYearMode = () => {
    const [numLights, setNumLights] = useState(0);

    useEffect(() => {
        const updateLights = () => {
            const lightWidth = 12 + 40; // width + margin
            const windowWidth = window.innerWidth;
            const count = Math.ceil(windowWidth / lightWidth) + 2;
            setNumLights(count);
        };

        updateLights();
        window.addEventListener('resize', updateLights);

        return () => window.removeEventListener('resize', updateLights);
    }, []);

    return (
        <div>
            <ul className={styles.lightrope}>
                {Array.from({length: numLights}, (_, i) => (
                    <li key={i} />
                ))}
            </ul>
        </div>
    );
};

export {NewYearMode, isNewYearMode};