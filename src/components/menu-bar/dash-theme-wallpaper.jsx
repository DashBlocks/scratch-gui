import classNames from 'classnames';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
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

class WallpaperThemeMenu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleFileChange',
            'handleOpenFilePicker',
            'handleRemoveWallpaper'
        ]);
        this.state = {
            selectedFiles: null
        };
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

    handleOpenFilePicker () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = ".img, .png, .jpg, .jpeg, .gif, .svg, .webp, .bmp, .ico, .tif, .tiff, .jfif, .pjpeg, .pjp, .avif, .cur, .apng";
        input.multiple = false;
        input.addEventListener('change', (e) => {
            if (e.target.files && e.target.files.length) {
                this.handleFileChange(e.target.files);
            } else {
                this.handleFileChange(null);
            }
        });
        document.body.appendChild(input);
        input.click();
        input.remove();
    }

    handleRemoveWallpaper () {
        this.setState({selectedFiles: null});
        this.props.onChangeTheme(
            this.props.theme.set('wallpaper', {url: null, opaque: 0.6})
        );
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
                    {/* todo: icon */}
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
                    <MenuItem onClick={this.handleOpenFilePicker}>
                        {this.state.selectedFiles ? (
                            <FormattedMessage
                                defaultMessage="Selected: {name}"
                                description="Shows selected wallpaper file name"
                                id="tw.fileInput.selected"
                                values={{
                                    name: this.state.selectedFiles[0].name
                                }}
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Choose wallpaper..."
                                description="Button text to choose a wallpaper file"
                                id="dash.wallpaper.choose"
                            />
                        )}
                    </MenuItem>
                    {this.props.theme.wallpaper.url && (
                        <MenuItem onClick={this.handleRemoveWallpaper}>
                            <FormattedMessage
                                defaultMessage="Remove wallpaper"
                                description="Option to remove wallpaper"
                                id="dash.wallpaper.remove"
                            />
                        </MenuItem>
                    )}
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
        persistTheme(theme);
    },
    onOpenMenu: () => dispatch(openWallpaperThemeMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WallpaperThemeMenu);
