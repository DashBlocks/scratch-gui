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

const Desktop = () => {
    const openFile = (file) => {
        window.open(`${RELEASES_DOWNLOAD_URL}/${file}`, '_blank', 'noreferrer');
    };
    
    return (
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
                <h2>Install {APP_NAME} Desktop (v{RELEASE_VERSION}):</h2>
            </section>
            <section>
                <h2>Windows 10 and later</h2>
                If a Windows SmartScreen alert appears, click "More info" then "Run anyways".
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Setup-${VERSION_IN_FILENAME}-x64.exe`)}
                    >
                        Download installer (64-bit, recommended)
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Setup-${VERSION_IN_FILENAME}-ia32.exe`)}
                    >
                        32-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Setup-${VERSION_IN_FILENAME}-arm64.exe`)}
                    >
                        ARM 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash.Portable.${VERSION_IN_FILENAME}.x64.exe`)}
                    >
                        Download portable (64-bit)
                    </Button>
                </div>

                <h2>Windows 7, 8, and 8.1</h2>
                These versions of the app have the same features but are slower and less secure. Support will be removed at an unknown time in the future. If a Windows SmartScreen alert appears, click "More info" then "Run anyways".
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Legacy-Setup-${VERSION_IN_FILENAME}-x64.exe`)}
                    >
                        Download legacy installer (64-bit, recommended)
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Legacy-Setup-${VERSION_IN_FILENAME}-ia32.exe`)}
                    >
                        32-bit
                    </Button>
                </div>

                <h2>macOS 12 and later</h2>
                Open the .DMG, then drag {APP_NAME} into Applications. If it tells you that {APP_NAME} already exists, choose "Replace".
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Setup-${VERSION_IN_FILENAME}.dmg`)}
                    >
                        Download for macOS 12 and later
                    </Button>
                </div>

                <h2>macOS 10.13 - 11</h2>
                These versions of the app have the same features but are slower and less secure. Support will be removed at an unknown time in the future. Open the .DMG, then drag {APP_NAME} into Applications. If it tells you that {APP_NAME} already exists, choose "Replace".
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Legacy-11-Setup-${VERSION_IN_FILENAME}.dmg`)}
                    >
                        macOS 11
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Legacy-10.15-Setup-${VERSION_IN_FILENAME}.dmg`)}
                    >
                        macOS 10.15
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-Legacy-10.13-10.14-Setup-${VERSION_IN_FILENAME}.dmg`)}
                    >
                        macOS 10.13 - 10.14
                    </Button>
                </div>

                <h2>Linux</h2>
                <h3>Debian, Ubuntu, and Linux Mint</h3>
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-amd64-${VERSION_IN_FILENAME}.deb`)}
                    >
                        x86 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-arm64-${VERSION_IN_FILENAME}.deb`)}
                    >
                        ARM 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-armv7l-${VERSION_IN_FILENAME}.deb`)}
                    >
                        ARMv7l
                    </Button>
                </div>
                <h3>AppImage</h3>
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-x86_64-${VERSION_IN_FILENAME}.AppImage`)}
                    >
                        x86 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-arm64-${VERSION_IN_FILENAME}.AppImage`)}
                    >
                        ARM 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-armv7l-${VERSION_IN_FILENAME}.AppImage`)}
                    >
                        ARMv7l
                    </Button>
                </div>
                <h3>tar.gz</h3>
                <div className={styles.downloadList}>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-x64-${VERSION_IN_FILENAME}.tar.gz`)}
                    >
                        x86 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-arm64-${VERSION_IN_FILENAME}.tar.gz`)}
                    >
                        ARM 64-bit
                    </Button>
                    <Button
                        className={styles.downloadButton}
                        onClick={() => openFile(`Dash-linux-armv7l-${VERSION_IN_FILENAME}.tar.gz`)}
                    >
                        ARMv7l
                    </Button>
                </div>
            </section>
            <Footer />
        </main>
    );
};

const WrappedDesktop = AppStateHOC(Desktop);

render(<WrappedDesktop />);
