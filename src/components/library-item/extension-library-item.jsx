import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';

import Box from '../box/box.jsx';
import styles from './library-item.css';
import extensionItemStyles from './extension-library-item.css';
import classNames from 'classnames';

import bluetoothIconURL from './bluetooth.svg';
import internetConnectionIconURL from './internet-connection.svg';

/* eslint-disable react/prefer-stateless-function */
class ExtensionLibraryItem extends React.PureComponent {
    render () {
        return (
            <div
                className={classNames(
                    styles.libraryItem,
                    extensionItemStyles.libraryItem,
                    {
                        [styles.hidden]: this.props.hidden,
                        [extensionItemStyles.disabled]: this.props.disabled
                    }
                )}
                onClick={this.props.onClick}
            >
                <div className={extensionItemStyles.libraryItemImageContainer}>
                    {this.props.disabled ? (
                        <div className={extensionItemStyles.comingSoonText}>
                            <FormattedMessage
                                defaultMessage="Coming Soon"
                                description="Label for extensions that are not yet implemented"
                                id="gui.extensionLibrary.comingSoon"
                            />
                        </div>
                    ) : null}
                    <img
                        className={extensionItemStyles.libraryItemImage}
                        loading="lazy"
                        draggable={false}
                        src={this.props.iconURL}
                    />
                </div>
                {this.props.insetIconURL ? (
                    <div className={styles.libraryItemInsetImageContainer}>
                        <img
                            className={styles.libraryItemInsetImage}
                            src={this.props.insetIconURL}
                            draggable={false}
                        />
                    </div>
                ) : null}
                <div className={styles.featuredText}>
                    <span>{this.props.name}</span>
                    <br />
                    <span className={styles.featuredDescription}>{this.props.description}</span>
                </div>

                {(
                    this.props.bluetoothRequired ||
                  this.props.internetConnectionRequired ||
                  this.props.collaborator ||
                  (this.props.credits && this.props.credits.length > 0) ||
                  this.props.docsURI ||
                  this.props.samples
                ) ? (
                    <div
                            className={classNames(
                                styles.libraryItemMetadata,
                                extensionItemStyles.libraryItemMetadata
                            )}
                        >
                            {this.props.bluetoothRequired || this.props.internetConnectionRequired ? (
                            <div className={styles.libraryItemMetadataSection}>
                                    <div>
                                    <div>
                                            <FormattedMessage
                                            defaultMessage="Requires"
                                            description="Label for extension hardware requirements"
                                            id="gui.extensionLibrary.requires"
                                        />
                                        </div>
                                    <div
                                            className={styles.libraryItemMetadataDetail}
                                        >
                                            {this.props.bluetoothRequired ? (
                                            <img
                                                    src={bluetoothIconURL}
                                                    draggable={false}
                                                />
                                            ) : null}
                                            {this.props.internetConnectionRequired ? (
                                            <img
                                                    src={internetConnectionIconURL}
                                                    draggable={false}
                                                />
                                            ) : null}
                                        </div>
                                </div>
                                </div>
                            ) : null}
                            {this.props.collaborator ? (
                            <div className={styles.libraryItemMetadataSection}>
                                    <div>
                                    <div>
                                            <FormattedMessage
                                            defaultMessage="Collaboration with"
                                            description="Label for extension collaboration"
                                            id="gui.extensionLibrary.collaboration"
                                        />
                                        </div>
                                    <div
                                            className={styles.libraryItemMetadataDetail}
                                        >
                                            {this.props.collaborator}
                                        </div>
                                </div>
                                </div>
                            ) : null}
                            {this.props.credits && this.props.credits.length > 0 ? (
                            <div className={styles.libraryItemMetadataSection}>
                                    <div>
                                    <div>
                                            <FormattedMessage
                                            defaultMessage="Created by"
                                            description="Appears in the extension list. Followed by a list of names."
                                            id="tw.createdBy"
                                        />
                                        </div>
                                    <div
                                            className={styles.libraryItemMetadataDetail}
                                        >
                                            {this.props.credits.map((credit, index) => (
                                            <React.Fragment key={index}>
                                                    {credit}
                                                    {index !== this.props.credits.length - 1 && (
                                                        ', '
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                </div>
                                </div>
                            ) : null}
                            {this.props.docsURI || this.props.samples ? (
                            <div className={styles.libraryItemMetadataSection}>
                                    <div>
                                    <div>
                                            <FormattedMessage
                                            defaultMessage="Resources"
                                            description="Label for extension resources"
                                            id="dash.extensionLibrary.resources"
                                        />
                                        </div>
                                    <div
                                            className={styles.libraryItemMetadataDetail}
                                        >
                                            {this.props.docsURI && (
                                        <a
                                                    href={this.props.docsURI}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <FormattedMessage
                                                defaultMessage="Documentation"
                                                        // eslint-disable-next-line max-len
                                                description="Appears in the extension list. Links to additional extension documentation."
                                                id="tw.documentation"
                                            />
                                                </a>
                                            )}
                                            {this.props.samples && (
                                        <React.Fragment>
                                                    {this.props.docsURI && (
                                            <br />
                                                    )}
                                                    {this.props.samples.map((sample, index) => (
                                                <React.Fragment key={index}>
                                                            <a
                                                                href={sample.href}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                <FormattedMessage
                                                                    defaultMessage="Sample project"
                                                                    // eslint-disable-next-line max-len
                                                                    description="Appears in the extension list. Links to a sample project for an extension."
                                                                    id="tw.sample"
                                                                />
                                                            </a>
                                                            {index !== this.props.samples.length - 1 && (
                                                                <br />
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </React.Fragment>
                                            )}
                                        </div>
                                </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                {this.props.favoriteButton}
            </div>
        );
    }
}
/* eslint-enable react/prefer-stateless-function */


ExtensionLibraryItem.propTypes = {
    bluetoothRequired: PropTypes.bool,
    collaborator: PropTypes.string,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    disabled: PropTypes.bool,
    extensionId: PropTypes.string,
    favoriteButton: PropTypes.node,
    hidden: PropTypes.bool,
    iconURL: PropTypes.string,
    insetIconURL: PropTypes.string,
    internetConnectionRequired: PropTypes.bool,
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
    onClick: PropTypes.func.isRequired
};

ExtensionLibraryItem.defaultProps = {
    disabled: false
};

export default ExtensionLibraryItem;
