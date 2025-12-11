import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';
import {connect} from 'react-redux';

import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {openWallpaperThemeMenu, wallpaperThemeMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const WallpaperThemeMenu = ({
    isOpen,
    isRtl,
    onChangeTheme,
    onOpenMenu,
    theme
}) => (
    <MenuItem expanded={isOpen}>
        <div
            className={styles.option}
            onClick={onOpenMenu}
        >
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Wallpaper"
                    description="Wallpaper label"
                    id="dash.wallpaper"
                />
            </span>
            <img
                className={styles.expandCaret}
                src={dropdownCaret}
                draggable={false}
            />
        </div>
        <Submenu place={isRtl ? 'left' : 'right'}>
            <div
                className={styles.option}
                onClick={() => onChangeTheme(theme.set('wallpaper', {url: "https://dashblocks.github.io/static/assets/828132f0a12c52c7af7e4115ee768ed5.svg", opaque: 0.6}))}
            >
                <FormattedMessage
                    defaultMessage="Set Wallpaper"
                    description="Label to set wallpaper"
                    id="dash.setWallpaper"
                />
            </div>
        </Submenu>
    </MenuItem>
);

WallpaperThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpenMenu: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: wallpaperThemeMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    },
    onOpenMenu: () => dispatch(openWallpaperThemeMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WallpaperThemeMenu);
