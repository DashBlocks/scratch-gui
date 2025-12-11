import React from 'react';
import PropTypes from 'prop-types';
import render from '../app-target';
import styles from './desktop.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import screenshot from './screenshot.png';

const version = '1.1.0';

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
            <p>Dash as a desktop app.</p>
            <img
                className={styles.screenshot}
                loading="lazy"
                src={screenshot}
            />
        </section>
        <section>
            <h2>Download (v{version}):</h2>
        </section>
        <section>
            <h3>Windows:</h3>
            <div className={styles.downloadList}>
                <button
                    onClick={() => {
                        window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop.Setup.${version}.exe`, '_blank', 'noreferrer');
                    }}
                >
                    Download for Windows (64-bit)
                </button>
            </div>
            <h3>Linux:</h3>
            <div className={styles.downloadList}>
                <button
                    onClick={() => {
                        window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop-${version}.AppImage`, '_blank', 'noreferrer');
                    }}
                >
                    Download for AppImage
                </button>
                <button
                    onClick={() => {
                        window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop-${version}-arm64.AppImage`, '_blank', 'noreferrer');
                    }}
                >
                    Download for AppImage (ARM 64-bit)
                </button>
            </div>
            <h3>macOS:</h3>
            <div className={styles.downloadList}>
                <button
                    onClick={() => {
                        window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop-${version}.dmg`, '_blank', 'noreferrer');
                    }}
                >
                    Download for macOS
                </button>
                <button
                    onClick={() => {
                        window.open(`https://github.com/DashBlocks/desktop/releases/download/v${version}/Dash.Desktop-${version}-arm64.dmg`, '_blank', 'noreferrer');
                    }}
                >
                    Download for macOS (ARM 64-bit)
                </button>
            </div>
        </section>
    </main>
);

render(<Desktop />);
