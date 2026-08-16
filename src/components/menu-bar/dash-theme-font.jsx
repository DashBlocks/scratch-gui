import classNames from 'classnames';
import {injectIntl} from 'react-intl';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import check from './check.svg';
import cross from './cross.svg';
import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {Theme} from '../../lib/themes/index.js';
import {openFontThemeMenu, fontThemeMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import customFontIcon from './dash-custom-font.svg';
import styles from './settings-menu.css';

class FontThemeMenu extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleFileChange',
            'handleOpenFilePicker',
            'handleResetFont',
            'handleSetForEverything'
        ]);
        this.state = {
            selectedFiles: null,
            isForEverything: false
        };
    }

    handleFileChange (files) {
        this.setState({selectedFiles: files});
        if (files && files.length > 0) {
            const file = files[0];
            const reader = new FileReader();
            reader.onload = e => {
                const dataUrl = e.target.result;
                this.props.onChangeTheme(
                    this.props.theme.set('font', {font: dataUrl})
                );
                const fontFace = new FontFace('customFont', `url(${dataUrl})`);
                fontFace.load().then(loadedFont => {
                    document.fonts.add(loadedFont);
                    document.body.style.fontFamily = 'customFont, "Helvetica Neue", Helvetica, sans-serif';
                })
                    .catch(console.error);
            };
            reader.readAsDataURL(file);
        }
    }

    handleOpenFilePicker () {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.ttf, .otf';
        input.multiple = false;
        input.addEventListener('change', e => {
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
    
    handleResetFont () {
        this.setState({selectedFiles: null});
        this.props.onChangeTheme(
            this.props.theme.set('font', {font: null})
        );
    }

    handleSetForEverything () {
        const newValue = !this.state.isForEverything;
        const fontFace = new FontFace('customFont', `url(${this.props.theme.font.font})`);
        this.setState({isForEverything: newValue});
        if (newValue && this.props.theme.font.font) {
            fontFace.load().then(loadedFont => {
                document.fonts.add(loadedFont);
                const style = document.createElement('style');
                style.innerHTML = `* {font-family: 'customFont', "Helvetica Neue", Helvetica, sans-serif !important;}`;
                document.head.appendChild(style);
            })
                .catch(console.error);
        } else {
            document.head.querySelectorAll('style').forEach(style => {
                if (style.innerHTML.includes("font-family: 'customFont'")) {
                    style.remove();
                }
            });
            fontFace.load().then(loadedFont => {
                document.fonts.add(loadedFont);
                document.body.style.fontFamily = 'customFont, "Helvetica Neue", Helvetica, sans-serif';
            })
                .catch(console.error);
        }
    }

    render () {
        const {
            isOpen,
            isRtl,
            onOpenMenu
        } = this.props;
        return (
            <>
                <MenuItem expanded={isOpen}>
                    <div
                        className={styles.option}
                        onClick={onOpenMenu}
                    >
                        <img
                            src={customFontIcon}
                            draggable={false}
                            width={24}
                        />
                        <span className={styles.submenuLabel}>
                            <FormattedMessage
                                defaultMessage="Custom Font"
                                description="Custom font label"
                                id="dash.font"
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
                                    defaultMessage="Selected: {names}"
                                    description="Shows selected wallpaper file name"
                                    id="tw.fileInput.selected"
                                    values={{
                                        names: this.state.selectedFiles[0].name
                                    }}
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="Choose font..."
                                    description="Button text to choose a font file"
                                    id="dash.font.choose"
                                />
                            )}
                        </MenuItem>
                        <MenuItem onClick={this.handleSetForEverything}>
                            <img
                                width={15}
                                height={12}
                                className={classNames(styles.check, {[styles.selected]: /* true*/ this.state.isForEverything})}
                                src={/* this.state.isForEverything ?*/ check /* : cross*/}
                                draggable={false}
                            />
                            <FormattedMessage
                                defaultMessage="Set for everything"
                                description="Option to set font for all elements"
                                id="dash.font.setForEverything"
                            />
                        </MenuItem>
                        <MenuItem
                            className={classNames({[styles.disabled]: this.props.theme.font.font == null})}
                            onClick={this.props.theme.font.font == null ? () => {} : this.handleResetFont}
                        >
                            <FormattedMessage
                                defaultMessage="Reset font"
                                description="Option to reset font"
                                id="dash.font.reset"
                            />
                        </MenuItem>
                    </Submenu>
                </MenuItem>
            </>
        );
    }
}

FontThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpenMenu: PropTypes.func,
    onRequestClose: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: fontThemeMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        persistTheme(theme);
    },
    onOpenMenu: () => dispatch(openFontThemeMenu()),
    onRequestClose: () => dispatch(closeSettingsMenu())
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(FontThemeMenu));
