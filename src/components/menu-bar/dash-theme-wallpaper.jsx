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
import FileInput from '../tw-custom-extension-modal/file-input.jsx';

class WallpaperThemeMenu extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            selectedFiles: null
        };
        this.handleFileChange = this.handleFileChange.bind(this);
    }

    handleFileChange (files) {
        this.setState({selectedFiles: files});
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                this.props.onChangeTheme(
                    this.props.theme.set('wallpaper', {url: dataUrl, opaque: 0.6})
                );
            };
            reader.readAsDataURL(file);
        }
    }

    render () {
        const {
            isOpen,
            isRtl,
            onOpenMenu
        } = this.props;
        return (
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
                    >
                        <FileInput
                            accept=".img, .png, .jpg, .jpeg, .gif, .svg, .webp, .bmp, .ico, .tif, .tiff, .jfif, .pjpeg, .pjp, .avif, .cur, .apng"
                            onChange={this.handleFileChange}
                            files={this.state.selectedFiles}
                        />
                    </div>
                </Submenu>
            </MenuItem>
        );
    }
}

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
