import {FormattedMessage, intlShape, defineMessages} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import SpriteCostumeLibraryItem from './sprite-costume-library-item.jsx';
import SoundLibraryItem from './sound-library-item.jsx';
import ExtensionLibraryItem from './extension-library-item.jsx';
import styles from './library-item.css';
import classNames from 'classnames';

import bluetoothIconURL from './bluetooth.svg';
import internetConnectionIconURL from './internet-connection.svg';
import favoriteInactiveIcon from './favorite-inactive.svg';
import favoriteActiveIcon from './favorite-active.svg';

const messages = defineMessages({
    favorite: {
        defaultMessage: 'Favorite',
        description: 'Alt text of icon in costume, sound, and extension libraries to mark an item as favorite.',
        id: 'tw.favorite'
    },
    unfavorite: {
        defaultMessage: 'Unfavorite',
        description: 'Alt text of icon in costume, sound, and extension libraries to unmark an item as favorite.',
        id: 'tw.unfavorite'
    }
});

/* eslint-disable react/prefer-stateless-function */
class LibraryItemComponent extends React.PureComponent {
    render () {
        const favoriteMessage = this.props.intl.formatMessage(
            this.props.favorite ? messages.unfavorite : messages.favorite
        );
        const favorite = (
            <button
                className={classNames(styles.favoriteContainer, {[styles.active]: this.props.favorite})}
                onClick={this.props.onFavorite}
            >
                <img
                    src={this.props.favorite ? favoriteActiveIcon : favoriteInactiveIcon}
                    className={styles.favoriteIcon}
                    draggable={false}
                    alt={favoriteMessage}
                    title={favoriteMessage}
                />
            </button>
        );

        return this.props.libraryId === "backdropLibrary" ? (
            <SpriteCostumeLibraryItem
                favoriteButton={favorite}
                {...this.props}
            />
        ) : this.props.libraryId === "spriteLibrary" || this.props.libraryId === "costumeLibrary" ? (
            <SpriteCostumeLibraryItem
                favoriteButton={favorite}
                {...this.props}
            />
        ) : this.props.libraryId === "soundLibrary" ? (
            <SoundLibraryItem
                favoriteButton={favorite}
                {...this.props}
            />
        ) : this.props.libraryId === "extensionLibrary" ? (
            <ExtensionLibraryItem
                favoriteButton={favorite}
                {...this.props}
            />
        ) : null;
    }
}
/* eslint-enable react/prefer-stateless-function */


LibraryItemComponent.propTypes = {
    intl: intlShape,
    bluetoothRequired: PropTypes.bool,
    collaborator: PropTypes.string,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    disabled: PropTypes.bool,
    extensionId: PropTypes.string,
    featured: PropTypes.bool,
    hidden: PropTypes.bool,
    iconURL: PropTypes.string,
    insetIconURL: PropTypes.string,
    internetConnectionRequired: PropTypes.bool,
    isPlaying: PropTypes.bool,
    libraryId: PropTypes.string.isRequired,
    name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    credits: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ])),
    docsURI: PropTypes.string,
    samples: PropTypes.arrayOf(PropTypes.shape({
        href: PropTypes.string,
        text: PropTypes.string
    })),
    favorite: PropTypes.bool,
    onFavorite: PropTypes.func,
    onBlur: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onMouseEnter: PropTypes.func.isRequired,
    onMouseLeave: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    showPlayButton: PropTypes.bool
};

export default LibraryItemComponent;
