import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import styles from './library-item.css';
import classNames from 'classnames';

/* eslint-disable react/prefer-stateless-function */
class SpriteCostumeLibraryItem extends React.PureComponent {
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
                onMouseEnter={this.props.onMouseEnter}
                onMouseLeave={this.props.onMouseLeave}
            >
                {/* Layers of wrapping is to prevent layout thrashing on animation */}
                <Box className={styles.libraryItemImageContainerWrapper}>
                    <Box
                        className={styles.libraryItemImageContainer}
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
                    {this.props.libraryId === 'spriteLibrary' && (
                        <>
                            <br />
                            <span className={styles.featuredThinDescription}>
                                <FormattedMessage
                                    defaultMessage="{costumesCount, plural, one {1 costume} other {# costumes}}"
                                    // eslint-disable-next-line max-len
                                    description="Appears in the sprite list. Shows the number of costumes the sprite has."
                                    id="dash.costumesCount"
                                    values={{
                                        costumesCount: this.props.icons.length
                                    }}
                                />
                            </span>
                        </>
                    )}
                </div>

                {this.props.favoriteButton}
            </Box>
        );
    }
}
/* eslint-enable react/prefer-stateless-function */


SpriteCostumeLibraryItem.propTypes = {
    favoriteButton: PropTypes.node,
    hidden: PropTypes.bool,
    iconURL: PropTypes.string,
    name: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    libraryId: PropTypes.string,
    icons: PropTypes.arrayOf(PropTypes.string),
    onBlur: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onKeyPress: PropTypes.func.isRequired,
    onMouseEnter: PropTypes.func.isRequired,
    onMouseLeave: PropTypes.func.isRequired
};

export default SpriteCostumeLibraryItem;
