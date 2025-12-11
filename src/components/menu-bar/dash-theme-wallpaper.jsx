import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';

import {MenuItem} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import styles from './settings-menu.css';

const WallpaperThemeMenu = ({
    onChangeTheme,
    theme
}) => (
    <MenuItem>
        <div
            className={styles.option}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={() => onChangeTheme(theme.set('wallpaper', {url: "https://dashblocks.github.io/static/assets/828132f0a12c52c7af7e4115ee768ed5.svg", opaque: 0.6}))}
        >
            <span className={styles.submenuLabel}>
                <FormattedMessage
                    defaultMessage="Set Wallpaper"
                    description="Menu item to set wallpaper"
                    id="dash.setWallpaper"
                />
            </span>
        </div>
    </MenuItem>
);

WallpaperThemeMenu.propTypes = {
    onChangeTheme: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WallpaperThemeMenu);
