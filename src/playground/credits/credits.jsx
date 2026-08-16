import React from 'react';
import PropTypes from 'prop-types';
import render from '../app-target';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import styles from './credits.css';

import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {Footer} from '../render-interface.jsx';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import UserData from './users';

/* eslint-disable react/jsx-no-literals, react/no-unescaped-entities */

applyGuiColors(detectTheme());
document.documentElement.lang = 'en';

const User = ({image, text, href}) => (
    <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={styles.user}
    >
        <img
            loading="lazy"
            className={styles.userImage}
            src={image}
            width="60"
            height="60"
        />
        <div className={styles.userInfo}>
            {text}
        </div>
    </a>
);
User.propTypes = {
    image: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    href: PropTypes.string
};

const UserList = ({users}) => (
    <div className={styles.users}>
        {users.map((data, index) => (
            <User
                key={index}
                {...data}
            />
        ))}
    </div>
);
UserList.propTypes = {
    users: PropTypes.arrayOf(PropTypes.object)
};

const Credits = () => (
    <main className={styles.main}>
        <LazyMenuBar />
        <header className={styles.headerContainer}>
            <h1 className={styles.headerText}>
                {APP_NAME} Credits
            </h1>
        </header>
        <section>
            <p>
                The {APP_NAME} project is made possible by the work of many volunteers.
            </p>
        </section>
        {APP_NAME !== 'Dash' && (
            // Be kind and considerate. Don't remove this :)
            <section>
                <h2>Dash</h2>
                <p>
                    {APP_NAME} is based on <a href="https://dashblocks.org/">Dash</a>.
                </p>
            </section>
        )}
        {APP_NAME !== 'TurboWarp' && (
            // Be kind and considerate. Don't remove this :)
            <section>
                <h2>TurboWarp</h2>
                <p>
                    <a href="https://turbowarp.org/">TurboWarp</a> is the parent project. {APP_NAME} is based on the work of the <a href="https://turbowarp.org/credits">TurboWarp contributors</a> but is not endorsed by TurboWarp in any way.
                </p>
            </section>
        )}
        <section>
            <h2>Scratch</h2>
            <p>
                {APP_NAME} is based on the work of the <a href="https://scratch.mit.edu/credits">Scratch contributors</a> but is not endorsed by Scratch in any way.
            </p>
            <p>
                <a href="https://scratch.mit.edu/donate">
                    Donate to support Scratch.
                </a>
            </p>
        </section>
        <section>
            <h2>Other modifications</h2>
            <p>
                {/* eslint-disable-next-line max-len */}
                {APP_NAME} uses code from other free and open-source TurboWarp modifications/visual programming languages:
            </p>
            <ul>
                <li>
                    <a href="https://penguinmod.com">PenguinMod</a>. {APP_NAME} uses an implementation of extensible blocks, Custom Block Shapes API and has a fork of the PenguinMod's paint editor.
                </li>
                <li>
                    <a href="https://ampmod.codeberg.page">AmpMod</a>. {APP_NAME} uses an implementation of array monitors (only 1D) and has some blocks clearly inspired to AmpMod's blocks from Arrays category.
                </li>
            </ul>
            <p>
                Also try them out!
            </p>
        </section>
        <section>
            <h2>Contributors</h2>
            <p>
                {APP_NAME} developers and people who contributed to {APP_NAME} and parent project(s) are listed here.
            </p>
            <UserList users={UserData.contributors} />
        </section>
        <section>
            <h2>Addons</h2>
            <UserList users={UserData.addonDevelopers} />
        </section>
        <section>
            <h2>Dash Extensions Gallery</h2>
            <p>
                {/* eslint-disable-next-line max-len */}
                People who develop extensions for Dash Extensions Gallery or whose extensions are included in it are listed here.
            </p>
            <UserList users={UserData.dashExtensionDevelopers} />
        </section>
        <section>
            <h2>TurboWarp Extension Gallery</h2>
            <p>
                {/* eslint-disable-next-line max-len */}
                People who develop extensions for TurboWarp Extension Gallery are listed here. Thanks to them for the wonderful and useful extensions.
            </p>
            <UserList users={UserData.twExtensionDevelopers} />
        </section>
        <section>
            <h2>Documentation</h2>
            <p>
                People who write the pages in the documentation or help to write are listed here.
            </p>
            <UserList users={UserData.docs} />
        </section>
        <section>
            <h2>Translators</h2>
            <p>
                More than 100 people have helped translate {APP_NAME} and its addons into many languages
                &mdash; far more than we could hope to list here.
            </p>
        </section>
        <section>
            <p>
                <i>
                    Individual contributors are listed in no particular order.
                    The order is randomized each visit.
                </i>
            </p>
        </section>
        <Footer />
    </main>
);

const WrappedCredits = AppStateHOC(Credits);

render(<WrappedCredits />);
