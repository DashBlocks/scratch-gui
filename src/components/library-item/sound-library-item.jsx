import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import PlayButton from '../../containers/play-button.jsx';
import styles from './library-item.css';
import classNames from 'classnames';

const formatTime = timeSeconds => {
    const minutes = (Math.floor(timeSeconds / 60))
        .toString()
        .padStart(2, '0');
    const seconds = (timeSeconds % 60)
        .toFixed(2)
        .padStart(5, '0');
    return `${minutes}:${seconds}`;
};

/* eslint-disable react/prefer-stateless-function */
class SoundLibraryItem extends React.PureComponent {
    render () {
        return (
            <Box
                className={classNames(
                    styles.libraryItem, {
                        [styles.hidden]: this.props.hidden
                    }
                )}
                role="button"
                tabIndex="0"
                onBlur={this.props.onBlur}
                onClick={this.props.onClick}
                onFocus={this.props.onFocus}
                onKeyPress={this.props.onKeyPress}
                onMouseEnter={this.props.showPlayButton ? null : this.props.onMouseEnter}
                onMouseLeave={this.props.showPlayButton ? null : this.props.onMouseLeave}
            >
                <Box className={styles.libraryItemImageContainerWrapper}>
                    <Box
                        className={styles.libraryItemImageContainer}
                        onMouseEnter={this.props.showPlayButton ? this.props.onMouseEnter : null}
                        onMouseLeave={this.props.showPlayButton ? this.props.onMouseLeave : null}
                    >
                        <img
                            className={styles.libraryItemImage}
                            loading="lazy"
                            src={this.props.iconURL}
                            draggable={false}
                        />
                    </Box>
                </Box>
                <div className={styles.featuredText}>
                    <span>{this.props.name}</span>
                    <br />
                    <span className={styles.featuredThinDescription}>
                        {formatTime(this.props.sampleCount / this.props.rate)}
                    </span>
                </div>
                {this.props.showPlayButton ? (
                    <PlayButton
                        isPlaying={this.props.isPlaying}
                        onPlay={this.props.onPlay}
                        onStop={this.props.onStop}
                    />
                ) : null}

                {this.props.favoriteButton}
            </Box>
        );
    }
}
/* eslint-enable react/prefer-stateless-function */


SoundLibraryItem.propTypes = {
    favoriteButton: PropTypes.node,
    hidden: PropTypes.bool,
    iconURL: PropTypes.string,
    isPlaying: PropTypes.bool,
    name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
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

SoundLibraryItem.defaultProps = {
    showPlayButton: false
};

export default SoundLibraryItem;
