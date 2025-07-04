import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {injectIntl, intlShape, defineMessages} from 'react-intl';

import LibraryItemComponent from '../components/library-item/library-item.jsx';

const messages = defineMessages({
    incompatible: {
        // eslint-disable-next-line max-len
        defaultMessage: 'This extension is incompatible with Scratch. Projects made with it cannot be uploaded to the Scratch website. Are you sure you want to enable it?',
        description: 'Confirm loading Scratch-incompatible extension',
        id: 'tw.confirmIncompatibleExtension'
    }
});

class LibraryItem extends React.PureComponent {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleBlur',
            'handleClick',
            'handleFavorite',
            'handleFocus',
            'handleKeyPress',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlay',
            'handleStop',
            'rotateIcon',
            'startRotatingIcons',
            'stopRotatingIcons'
        ]);
        this.state = {
            iconIndex: 0,
            isRotatingIcon: false
        };
    }
    componentWillUnmount () {
        clearInterval(this.intervalId);
    }
    handleBlur (id) {
        this.handleMouseLeave(id);
    }
    handleClick (e) {
        if (e.target.closest('a')) {
            // Allow clicking on links inside the item
            return;
        }

        if (
            !this.props.favorite &&
            this.props.incompatibleWithScratch &&
            !e.shiftKey &&
            // eslint-disable-next-line no-alert
            !confirm(this.props.intl.formatMessage(messages.incompatible))
        ) {
            return;
        }

        if (!this.props.disabled) {
            if (this.props.href) {
                window.open(this.props.href);
            } else {
                this.props.onSelect(this.props.id);
            }
        }
        e.preventDefault();
    }
    handleFavorite (e) {
        e.stopPropagation();
        this.props.onFavorite(this.props.id);
    }
    handleFocus (id) {
        if (!this.props.showPlayButton) {
            this.handleMouseEnter(id);
        }
    }
    handleKeyPress (e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.props.onSelect(this.props.id);
        }
    }
    handleMouseEnter () {
        // only show hover effects on the item if not showing a play button
        if (!this.props.showPlayButton) {
            this.props.onMouseEnter(this.props.id);
            if (this.props.icons && this.props.icons.length) {
                this.stopRotatingIcons();
                this.setState({
                    isRotatingIcon: true
                }, this.startRotatingIcons);
            }
        }
    }
    handleMouseLeave () {
        // only show hover effects on the item if not showing a play button
        if (!this.props.showPlayButton) {
            this.props.onMouseLeave(this.props.id);
            if (this.props.icons && this.props.icons.length) {
                this.setState({
                    isRotatingIcon: false
                }, this.stopRotatingIcons);
            }
        }
    }
    handlePlay () {
        this.props.onMouseEnter(this.props.id);
    }
    handleStop () {
        this.props.onMouseLeave(this.props.id);
    }
    startRotatingIcons () {
        this.rotateIcon();
        this.intervalId = setInterval(this.rotateIcon, 300);
    }
    stopRotatingIcons () {
        if (this.intervalId) {
            this.intervalId = clearInterval(this.intervalId);
        }
    }
    rotateIcon () {
        const nextIconIndex = (this.state.iconIndex + 1) % this.props.icons.length;
        this.setState({iconIndex: nextIconIndex});
    }
    curIconMd5 () {
        const iconMd5Prop = this.props.iconMd5;
        if (this.props.icons &&
            this.state.isRotatingIcon &&
            this.state.iconIndex < this.props.icons.length) {
            const icon = this.props.icons[this.state.iconIndex] || {};
            return icon.md5ext || // 3.0 library format
                icon.baseLayerMD5 || // 2.0 library format, TODO GH-5084
                iconMd5Prop;
        }
        return iconMd5Prop;
    }
    render () {
        /* const url = this.props.icons && this.props.icons.length > 0 ?
            this.props.icons[this.state.iconIndex].url : null; */
        const iconMd5 = this.curIconMd5();
        const iconURL = iconMd5 ?
            `https://cdn.assets.scratch.mit.edu/internalapi/asset/${iconMd5}/get/` :
            this.props.iconRawURL;
        return (
            <LibraryItemComponent
                intl={this.props.intl}
                bluetoothRequired={this.props.bluetoothRequired}
                collaborator={this.props.collaborator}
                description={this.props.description}
                disabled={this.props.disabled}
                extensionId={this.props.extensionId}
                featured={this.props.featured}
                hidden={this.props.hidden}
                iconURL={iconURL}
                icons={this.props.icons}
                id={this.props.id}
                insetIconURL={this.props.insetIconURL}
                internetConnectionRequired={this.props.internetConnectionRequired}
                isPlaying={this.props.isPlaying}
                name={this.props.name}
                credits={this.props.credits}
                docsURI={this.props.docsURI}
                samples={this.props.samples}
                favorite={this.props.favorite}
                onFavorite={this.handleFavorite}
                showPlayButton={this.props.showPlayButton}
                onBlur={this.handleBlur}
                onClick={this.handleClick}
                onFocus={this.handleFocus}
                onKeyPress={this.handleKeyPress}
                onMouseEnter={this.handleMouseEnter}
                onMouseLeave={this.handleMouseLeave}
                onPlay={this.handlePlay}
                onStop={this.handleStop}
            />
        );
    }
}

LibraryItem.propTypes = {
    intl: intlShape,
    bluetoothRequired: PropTypes.bool,
    collaborator: PropTypes.string,
    description: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.node
    ]),
    disabled: PropTypes.bool,
    extensionId: PropTypes.string,
    href: PropTypes.string,
    featured: PropTypes.bool,
    hidden: PropTypes.bool,
    iconMd5: PropTypes.string,
    iconRawURL: PropTypes.string,
    icons: PropTypes.arrayOf(
        PropTypes.shape({
            baseLayerMD5: PropTypes.string, // 2.0 library format, TODO GH-5084
            md5ext: PropTypes.string // 3.0 library format
        })
    ),
    id: PropTypes.number.isRequired,
    incompatibleWithScratch: PropTypes.bool,
    insetIconURL: PropTypes.string,
    internetConnectionRequired: PropTypes.bool,
    isPlaying: PropTypes.bool,
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
    onMouseEnter: PropTypes.func.isRequired,
    onMouseLeave: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    showPlayButton: PropTypes.bool
};

export default injectIntl(LibraryItem);
