import React from 'react';
import PropTypes from 'prop-types';
import render from '../app-target';
import styles from './desktop.css';

import Button from '../../components/button/button.jsx';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import screenshotLight from './screenshot-light.png';
import screenshotDark from './screenshot-dark.png';

const version = '2.2.0';
const releasesDownloadUrl = "https://github.com/DashBlocks/desktop/releases/download/v${version}";

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

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
                src={theme.isDark() ? screenshotDark : screenshotLight}
            />
        </section>
        <section>
            <h2>Download (v{version}):</h2>
        </section>
        <section>
            <h3>Windows:</h3>
            <div className={styles.downloadList}>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop.Setup.${version}.exe`, '_blank', 'noreferrer');
                    }}
                >
                    Download for Windows (64-bit)
                </Button>
            </div>
            <h3>Linux:</h3>
            <div className={styles.downloadList}>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop-${version}.AppImage`, '_blank', 'noreferrer');
                    }}
                >
                    Download for AppImage
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop-${version}-arm64.AppImage`, '_blank', 'noreferrer');
                    }}
                >
                    Download for AppImage (ARM 64-bit)
                </Button>
            </div>
            <h3>macOS:</h3>
            <div className={styles.downloadList}>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop-${version}.dmg`, '_blank', 'noreferrer');
                    }}
                >
                    Download for macOS
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop-${version}-arm64.dmg`, '_blank', 'noreferrer');
                    }}
                >
                    Download for macOS (ARM 64-bit)
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop-${version}-mac.zip`, '_blank', 'noreferrer');
                    }}
                >
                    Download ZIP for macOS
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${releasesDownloadUrl}/Dash.Desktop-${version}-arm64-mac.zip`, '_blank', 'noreferrer');
                    }}
                >
                    Download ZIP for macOS (ARM 64-bit)
                </Button>
            </div>
        </section>
    </main>
);

render(<Desktop />);
