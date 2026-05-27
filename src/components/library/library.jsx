import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import LibraryItem from '../../containers/library-item.jsx';
import Modal from '../../containers/modal.jsx';
import Filter from '../filter/filter.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';
import Separator from '../tw-extension-separator/separator.jsx';
import RemovedTrademarks from '../tw-removed-trademarks/removed-trademarks.jsx';
import {APP_NAME} from '../../lib/brand.js';

import TWRenderRecoloredImage from '../../lib/tw-recolor/render.jsx';
import arrowIcon from '!../../lib/tw-recolor/build!./icon--arrow.svg';
import styles from './library.css';

const messages = defineMessages({
    filterPlaceholder: {
        id: 'gui.library.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for library search field'
    }
});

class LibraryComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleFilterChange',
            'handleFilterClear',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlayingEnd',
            'handleSelect',
            'handleFavorite',
            'handleTagClick',
            'handleFilterBarToggling',
            'setFilteredDataRef'
        ]);
        const favorites = this.readFavoritesFromStorage();
        this.state = {
            playingItem: null,
            filterQuery: '',
            filterBarOpened: true,
            selectedTags: new Set(),
            canDisplay: false,
            favorites,
            initialFavorites: favorites
        };
    }
    componentDidMount () {
        // Rendering all the items in the library can take a bit, so we'll always
        // show one frame with a loading spinner.
        setTimeout(() => {
            this.setState({
                canDisplay: true
            });
        });
        if (this.props.setStopHandler) this.props.setStopHandler(this.handlePlayingEnd);
    }
    componentDidUpdate (prevProps, prevState) {
        if (prevState.filterQuery !== this.state.filterQuery ||
            prevState.selectedTags !== this.state.selectedTags) {
            this.scrollToTop();
        }

        if (this.state.favorites !== prevState.favorites) {
            try {
                localStorage.setItem(this.getFavoriteStorageKey(), JSON.stringify(this.state.favorites));
            } catch (error) {
                // ignore
            }
        }
    }
    handleSelect (id) {
        this.handleClose();
        this.props.onItemSelected(this.getFilteredData()[id]);
    }
    readFavoritesFromStorage () {
        let data;
        try {
            data = JSON.parse(localStorage.getItem(this.getFavoriteStorageKey()));
        } catch (error) {
            // ignore
        }
        if (!Array.isArray(data)) {
            data = [];
        }
        return data;
    }
    getFavoriteStorageKey () {
        return `tw:library-favorites:${this.props.id}`;
    }
    handleFavorite (id) {
        const data = this.getFilteredData()[id];
        const key = data[this.props.persistableKey];
        this.setState(oldState => ({
            favorites: oldState.favorites.includes(key) ? (
                oldState.favorites.filter(i => i !== key)
            ) : (
                [...oldState.favorites, key]
            )
        }));
    }
    handleClose () {
        this.props.onRequestClose();
    }
    handleTagClick (tag) {
        const lowerCaseTag = tag.toLowerCase();
        const tagSet = new Set([lowerCaseTag]);
        if (this.state.playingItem === null) {
            this.setState(oldState => ({
                selectedTags: oldState.selectedTags.has(lowerCaseTag)
                    ? oldState.selectedTags.difference(tagSet)
                    : oldState.selectedTags.union(tagSet)
            }));
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[this.state.playingItem]);
            this.setState(oldState => ({
                playingItem: null,
                selectedTags: oldState.selectedTags.has(lowerCaseTag)
                    ? oldState.selectedTags.difference(tagSet)
                    : oldState.selectedTags.union(tagSet)
            }));
        }
    }
    handleMouseEnter (id) {
        // don't restart if mouse over already playing item
        if (this.props.onItemMouseEnter && this.state.playingItem !== id) {
            this.props.onItemMouseEnter(this.getFilteredData()[id]);
            this.setState({
                playingItem: id
            });
        }
    }
    handleMouseLeave (id) {
        if (this.props.onItemMouseLeave) {
            this.props.onItemMouseLeave(this.getFilteredData()[id]);
            this.setState({
                playingItem: null
            });
        }
    }
    handlePlayingEnd () {
        if (this.state.playingItem !== null) {
            this.setState({
                playingItem: null
            });
        }
    }
    handleFilterChange (event) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: event.target.value
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[this.state.playingItem]);
            this.setState({
                filterQuery: event.target.value,
                playingItem: null
            });
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    handleFilterBarToggling () {
        this.setState(oldState => ({
            filterBarOpened: !oldState.filterBarOpened
        }));
    }
    getFilteredData () {
        // When no filtering, favorites get their own section
        if (this.state.selectedTags.size === 0 && !this.state.filterQuery) {
            const favoriteItems = this.props.data
                .filter(dataItem => (
                    this.state.initialFavorites.includes(dataItem[this.props.persistableKey])
                ))
                .map(dataItem => ({
                    ...dataItem,
                    key: `favorite-${dataItem[this.props.persistableKey]}`
                }));

            if (favoriteItems.length) {
                favoriteItems.push('---');
            }

            return [
                ...favoriteItems,
                ...this.props.data
            ];
        }

        // When filtering, favorites are just listed first, not in a separate section.
        const favoriteItems = [];
        const nonFavoriteItems = [];
        for (const dataItem of this.props.data) {
            if (dataItem === '---') {
                // ignore
            } else if (this.state.initialFavorites.includes(dataItem[this.props.persistableKey])) {
                favoriteItems.push(dataItem);
            } else {
                nonFavoriteItems.push(dataItem);
            }
        }

        let filteredItems = favoriteItems.concat(nonFavoriteItems);

        if (this.state.selectedTags.size > 0) {
            filteredItems = filteredItems.filter(dataItem => (
                dataItem.tags &&
                new Set(dataItem.tags.map(i => i.toLowerCase())).isSubsetOf(this.state.selectedTags)
            ));
        }

        if (this.state.filterQuery) {
            filteredItems = filteredItems.filter(dataItem => {
                const search = [...dataItem.tags];
                if (dataItem.name) {
                    // Use the name if it is a string, else use formatMessage to get the translated name
                    if (typeof dataItem.name === 'string') {
                        search.push(dataItem.name);
                    } else {
                        search.push(this.props.intl.formatMessage(dataItem.name.props, {
                            APP_NAME
                        }));
                    }
                }
                if (dataItem.description) {
                    search.push(dataItem.description);
                }
                return search
                    .join('\n')
                    .toLowerCase()
                    .includes(this.state.filterQuery.toLowerCase());
            });
        }

        return filteredItems;
    }
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }
    render () {
        const filteredData = this.state.canDisplay && this.props.data && this.getFilteredData();
        return (
            <Modal
                fullScreen
                contentLabel={this.props.title}
                id={this.props.id}
                onRequestClose={this.handleClose}
            >
                <div className={styles.libraryWrapper}>
                    {(this.props.filterable || this.props.tags) && (
                        <div className={styles.filterBar}>
                            {this.state.filterBarOpened && (
                                <div className={styles.filterBarContent}>
                                    {this.props.filterable && (
                                        <Filter
                                            className={styles.filter}
                                            filterQuery={this.state.filterQuery}
                                            placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                                            onChange={this.handleFilterChange}
                                            onClear={this.handleFilterClear}
                                        />
                                    )}
                                    {this.props.filterable && this.props.tags && (
                                        <div className={styles.divider} />
                                    )}
                                    {this.props.tags &&
                                        <div className={styles.tagWrapper}>
                                            {this.props.tags.map((tagProps, index) => (
                                                tagProps === '---' ? (
                                                    <div className={styles.divider} />
                                                ) : tagProps.isGroup ? (
                                                    <h4
                                                        className={tagProps.className}
                                                        key={index}
                                                    >
                                                        {typeof tagProps.intlLabel === 'string' ? tagProps.intlLabel : (
                                                            <FormattedMessage {...tagProps.intlLabel} />
                                                        )}
                                                    </h4>
                                                ) : (
                                                    <TagButton
                                                        active={this.state.selectedTags.has(tagProps.tag.toLowerCase())}
                                                        className={classNames(
                                                            styles.tagButton,
                                                            tagProps.className
                                                        )}
                                                        key={index}
                                                        onClick={this.handleTagClick}
                                                        {...tagProps}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    }
                                </div>
                            )}
                            <div
                                className={styles.arrowIconWrapper}
                                onClick={this.handleFilterBarToggling}
                            >
                                <TWRenderRecoloredImage
                                    className={classNames(styles.arrowIcon, {
                                        [styles.isOpened]: this.state.filterBarOpened
                                    })}
                                    src={arrowIcon}
                                />
                            </div>
                        </div>
                    )}
                    <div
                        className={styles.libraryScrollGrid}
                        ref={this.setFilteredDataRef}
                    >
                        {filteredData && this.getFilteredData().map((dataItem, index) => (
                            dataItem === '---' ? (
                                <Separator key={index} />
                            ) : dataItem === 'twGalleryMirror' ? (
                                <div key={index} className={styles.twGalleryMirrorNote}>
                                    {this.props.intl.formatMessage({
                                        id: 'dash.extensionLibrary.twGalleryMirrorNote',
                                        defaultMessage: 'Note: You are currently viewing a mirror of the TurboWarp Extension Gallery. Some extensions may be out of date or unavailable.',
                                        description: 'Note indicating that the TurboWarp Extension Gallery is being served from a mirror site.'
                                    })}
                                </div>
                            ) : (
                                <LibraryItem
                                    bluetoothRequired={dataItem.bluetoothRequired}
                                    collaborator={dataItem.collaborator}
                                    description={dataItem.description}
                                    disabled={dataItem.disabled}
                                    extensionId={dataItem.extensionId}
                                    href={dataItem.href}
                                    featured={dataItem.featured}
                                    hidden={dataItem.hidden}
                                    iconMd5={dataItem.costumes ? dataItem.costumes[0].md5ext : dataItem.md5ext}
                                    iconRawURL={dataItem.rawURL}
                                    icons={dataItem.costumes}
                                    id={index}
                                    incompatibleWithScratch={dataItem.incompatibleWithScratch}
                                    favorite={this.state.favorites.includes(dataItem[this.props.persistableKey])}
                                    onFavorite={this.handleFavorite}
                                    insetIconURL={dataItem.insetIconURL}
                                    internetConnectionRequired={dataItem.internetConnectionRequired}
                                    isPlaying={this.state.playingItem === index}
                                    key={dataItem.key || (
                                        dataItem.extensionId ? dataItem.extensionId :
                                        (typeof dataItem.name === 'string' ?
                                            dataItem.name :
                                            dataItem.rawURL)
                                    )}
                                    name={dataItem.name}
                                    credits={dataItem.credits}
                                    samples={dataItem.samples}
                                    docsURI={dataItem.docsURI}
                                    showPlayButton={this.props.showPlayButton}
                                    onMouseEnter={this.handleMouseEnter}
                                    onMouseLeave={this.handleMouseLeave}
                                    onSelect={this.handleSelect}
                                />
                            )
                        ))}
                        {filteredData && this.props.removedTrademarks && (
                            <React.Fragment>
                                {filteredData.length > 0 && (
                                    <Separator />
                                )}
                                <RemovedTrademarks />
                            </React.Fragment>
                        )}
                        {!filteredData && (
                            <div className={styles.spinnerWrapper}>
                                <Spinner
                                    large
                                    level="primary"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        );
    }
}

LibraryComponent.propTypes = {
    data: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.oneOfType([
            /* eslint-disable react/no-unused-prop-types, lines-around-comment */
            // An item in the library
            PropTypes.shape({
                // @todo remove md5/rawURL prop from library, refactor to use storage
                md5: PropTypes.string,
                name: PropTypes.oneOfType([
                    PropTypes.string,
                    PropTypes.node
                ]),
                rawURL: PropTypes.string
            }),
            PropTypes.string
            /* eslint-enable react/no-unused-prop-types, lines-around-comment */
        ])),
        PropTypes.instanceOf(Promise)
    ]),
    filterable: PropTypes.bool,
    id: PropTypes.string.isRequired,
    persistableKey: PropTypes.string,
    intl: intlShape.isRequired,
    onItemMouseEnter: PropTypes.func,
    onItemMouseLeave: PropTypes.func,
    onItemSelected: PropTypes.func,
    onRequestClose: PropTypes.func,
    setStopHandler: PropTypes.func,
    showPlayButton: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.oneOfType([
        PropTypes.shape(TagButton.propTypes),
        PropTypes.shape({
            intlLabel: PropTypes.oneOfType([
                PropTypes.shape({
                    defaultMessage: PropTypes.string,
                    description: PropTypes.string,
                    id: PropTypes.string
                }),
                PropTypes.string
            ]).isRequired,
            isGroup: PropTypes.bool.isRequired
        }),
        PropTypes.string
    ])),
    title: PropTypes.string.isRequired,
    removedTrademarks: PropTypes.bool
};

LibraryComponent.defaultProps = {
    filterable: true,
    persistableKey: 'name',
    showPlayButton: false
};

export default injectIntl(LibraryComponent);
