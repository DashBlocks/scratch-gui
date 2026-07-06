import React from 'react';
import PropTypes from 'prop-types';
import render from '../app-target';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import styles from './desktop.css';

import Button from '../../components/button/button.jsx';

import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {Footer} from '../render-interface.jsx';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import screenshotLight from './screenshot-light.png';
import screenshotDark from './screenshot-dark.png';

const RELEASE_VERSION = '1.2.0';
const VERSION_IN_FILENAME = '1.2.0';
const RELEASES_DOWNLOAD_URL = `https://github.com/DashBlocks/dash-desktop/releases/download/v${RELEASE_VERSION}`;

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const Desktop = () => (
    <main className={styles.main}>
        <LazyMenuBar />
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
            <h2>Download (v{RELEASE_VERSION}):</h2>
        </section>
        <section>
            <h3>Windows:</h3>
            <div className={styles.downloadList}>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${RELEASES_DOWNLOAD_URL}/Dash-Setup-${VERSION_IN_FILENAME}-x64.exe`, '_blank', 'noreferrer');
                    }}
                >
                    Download for Windows (64-bit)
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${RELEASES_DOWNLOAD_URL}/Dash-Setup-${VERSION_IN_FILENAME}-arm64.exe`, '_blank', 'noreferrer');
                    }}
                >
                    Download for Windows (ARM 64-bit)
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${RELEASES_DOWNLOAD_URL}/Dash-Setup-${VERSION_IN_FILENAME}-ia32.exe`, '_blank', 'noreferrer');
                    }}
                >
                    Download for Windows (ia32)
                </Button>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${RELEASES_DOWNLOAD_URL}/Dash.Portable.${VERSION_IN_FILENAME}.x64.exe`, '_blank', 'noreferrer');
                    }}
                >
                    Download portable for Windows (64-bit)
                </Button>
            </div>
            <h3>macOS:</h3>
            <div className={styles.downloadList}>
                <Button
                    className={styles.downloadButton}
                    onClick={() => {
                        window.open(`${RELEASES_DOWNLOAD_URL}/Dash-Setup-${VERSION_IN_FILENAME}.dmg`, '_blank', 'noreferrer');
                    }}
                >
                    Download for macOS
                </Button>
            </div>
        </section>
        <Footer />
    </main>
);

const WrappedDesktop = AppStateHOC(Desktop);

render(<WrappedDesktop />);
