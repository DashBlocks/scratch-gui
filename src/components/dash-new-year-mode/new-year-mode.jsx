import React, { useState, useEffect } from 'react';
import styles from './new-year-mode.css';

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

export default NewYearMode;