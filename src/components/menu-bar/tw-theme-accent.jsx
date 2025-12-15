import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, defineMessages} from 'react-intl';
import {connect} from 'react-redux';

import check from './check.svg';
import dropdownCaret from './dropdown-caret.svg';
import {MenuItem, Submenu} from '../menu/menu.jsx';
import {ACCENT_BLUE, ACCENT_MAP, ACCENT_PURPLE, ACCENT_RED, ACCENT_ORANGE, ACCENT_GREEN, ACCENT_RAINBOW, ACCENT_CUSTOM, Theme} from '../../lib/themes/index.js';
import {openAccentMenu, accentMenuOpen, closeSettingsMenu} from '../../reducers/menus.js';
import {setTheme} from '../../reducers/theme.js';
import {persistTheme} from '../../lib/themes/themePersistance.js';
import rainbowIcon from './tw-accent-rainbow.svg';
import customIcon from './icon--edit.svg';
import styles from './settings-menu.css';

const options = defineMessages({
    [ACCENT_ORANGE]: {
        defaultMessage: 'Orange',
        description: 'Name of the orange color scheme, used by Dash by default',
        id: 'tw.accent.orange'
    },
    [ACCENT_GREEN]: {
        defaultMessage: 'Green',
        description: 'Name of the green color scheme, created by Dash developer',
        id: 'tw.accent.green'
    },
    [ACCENT_RED]: {
        defaultMessage: 'Red',
        description: 'Name of the red color scheme. Matches modern TurboWarp',
        id: 'tw.accent.red'
    },
    [ACCENT_PURPLE]: {
        defaultMessage: 'Purple',
        description: 'Name of the purple color scheme. Matches modern Scratch.',
        id: 'tw.accent.purple'
    },
    [ACCENT_BLUE]: {
        defaultMessage: 'Blue',
        description: 'Name of the blue color scheme. Matches Scratch before the high contrast update.',
        id: 'tw.accent.blue'
    },
    [ACCENT_RAINBOW]: {
        defaultMessage: 'Rainbow',
        description: 'Name of color scheme that uses a rainbow.',
        id: 'tw.accent.rainbow'
    },
    [ACCENT_CUSTOM]: {
        defaultMessage: 'Custom',
        description: 'Name of color scheme that uses a custom.',
        id: 'dash.accent.custom'
    }
});

const icons = {
    [ACCENT_RAINBOW]: rainbowIcon,
    [ACCENT_CUSTOM]: customIcon
};

const ColorIcon = props => (
    icons[props.id] ? (
        <img
            className={styles.accentIconOuter}
            src={icons[props.id]}
            draggable={false}
            // Image is decorative
            alt=""
        />
    ) : (
        <div
            className={styles.accentIconOuter}
            style={{
                // menu-bar-background is var(...), don't want to evaluate with the current values
                backgroundColor: ACCENT_MAP[props.id].guiColors['looks-secondary'],
                backgroundImage: ACCENT_MAP[props.id].guiColors['menu-bar-background-image']
            }}
        />
    )
);

ColorIcon.propTypes = {
    id: PropTypes.string
};

const AccentMenuItem = props => (
    <MenuItem onClick={props.onClick}>
        <div className={styles.option}>
            <img
                className={classNames(styles.check, {[styles.selected]: props.isSelected})}
                width={15}
                height={12}
                src={check}
                draggable={false}
            />
            <ColorIcon id={props.id} />
            <FormattedMessage {...options[props.id]} />
        </div>
    </MenuItem>
);

AccentMenuItem.propTypes = {
    id: PropTypes.string,
    isSelected: PropTypes.bool,
    onClick: PropTypes.func
};

class AccentThemeMenu extends React.Component {
    constructor (props) {
        super(props);
        this.colorInput = React.createRef();
    }

    handleItemClick = (item) => {
        if (item === ACCENT_CUSTOM) {
            if (this.colorInput && this.colorInput.current) this.colorInput.current.click();
            return;
        }
        this.props.onChangeTheme(this.props.theme.set('accent', item));
    }

    handleColorChange = (e) => {
        const color = e.target.value;
        try {
            localStorage.setItem('dash:accent_custom_color', color);
        } catch (e) {
            // ignore
        }
        document.documentElement.style.setProperty('--dash-accent-custom', color);
        this.props.onChangeTheme(this.props.theme.set('accent', ACCENT_CUSTOM));
    }

    render () {
        const {isOpen, isRtl, onOpen, theme} = this.props;
        return (
            <MenuItem expanded={isOpen}>
                <div
                    className={styles.option}
                    onClick={onOpen}
                >
                    <ColorIcon id={theme.accent} />
                    <span className={styles.submenuLabel}>
                        <FormattedMessage
                            defaultMessage="Accent"
                            description="Label for menu to choose accent color (eg. TurboWarp's red, Scratch's purple)"
                            id="tw.menuBar.accent"
                        />
                    </span>
                    <img
                        className={styles.expandCaret}
                        src={dropdownCaret}
                        draggable={false}
                    />
                </div>
                <Submenu place={isRtl ? 'left' : 'right'}>
                    {Object.keys(options).map(item => (
                        <AccentMenuItem
                            key={item}
                            id={item}
                            isSelected={theme.accent === item}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => this.handleItemClick(item)}
                        />
                    ))}
                </Submenu>
                <input
                    ref={this.colorInput}
                    type="color"
                    style={{display: 'none'}}
                    onChange={this.handleColorChange}
                />
            </MenuItem>
        );
    }
}

AccentThemeMenu.propTypes = {
    isOpen: PropTypes.bool,
    isRtl: PropTypes.bool,
    onChangeTheme: PropTypes.func,
    onOpen: PropTypes.func,
    theme: PropTypes.instanceOf(Theme)
};

const mapStateToProps = state => ({
    isOpen: accentMenuOpen(state),
    isRtl: state.locales.isRtl,
    theme: state.scratchGui.theme.theme
});

const mapDispatchToProps = dispatch => ({
    onChangeTheme: theme => {
        dispatch(setTheme(theme));
        dispatch(closeSettingsMenu());
        persistTheme(theme);
    },
    onOpen: () => dispatch(openAccentMenu())
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AccentThemeMenu);
