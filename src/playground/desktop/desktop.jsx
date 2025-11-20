import React from 'react';
import PropTypes from 'prop-types';
import render from '../app-target';
import styles from './desktop.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

const version = '1.0.0';

/* eslint-disable react/jsx-no-literals */

applyGuiColors(detectTheme());

const Desktop = () => (
    <main className={styles.main}>
        <header className={styles.headerContainer}>
            <h1 className={styles.headerText}>
                {APP_NAME} Desktop
            </h1>
        </header>
        <section>
            <p>
                Dash as a desktop app.
            </p>
        </section>
        <section>
            <h2>Download (v{version}):</h2>
        </section>
        <section>
            <button
                className={styles.downloadButton}
                onClick={() => {
                    window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop.Setup.${version}.exe`, '_blank', 'noreferrer');
                }}
            >
                Download for Windows (x64)
            </button>
        </section>
        <section>
            <button
                onClick={() => {
                    window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop-${version}.AppImage`, '_blank', 'noreferrer');
                }}
            >
                Download for AppImage (Linux)
            </button>
        </section>
        <section>
            <button
                onClick={() => {
                    window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop-${version}-arm64.AppImage`, '_blank', 'noreferrer');
                }}
            >
                Download for AppImage x64 (Linux)
            </button>
        </section>
    </main>
);

render(<Desktop />);
