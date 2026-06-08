import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import FeaturedProjects from './featured-projects';
import styles from './featured-projects.css';

const messages = defineMessages({
    authorAttribution: {
        defaultMessage: 'by {author}',
        description: 'Displayed in StudioView under project title to credit creator',
        id: 'tw.studioview.authorAttribution'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed in StudioView when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
    error: {
        defaultMessage: 'There was an error loading the next page of projects.',
        description: 'Displayed in StudioView when an error occurs',
        id: 'tw.studioview.error'
    }
});

class FeaturedProjectsViewComponent extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSelect',
            'ref'
        ]);
    }
    componentDidMount () {
        this.featuredProjects = new FeaturedProjects();
        this.featuredProjects.messages.AUTHOR_ATTRIBUTION = this.props.intl.formatMessage(messages.authorAttribution, {
            // featured-projects uses $-based variables
            author: '$author'
        });
        this.featuredProjects.messages.PROJECT_HOVER_TEXT = this.props.intl.formatMessage(messages.hoverText, {
            // featured-projects uses $-based variables
            author: '$author',
            title: '$title'
        });
        this.featuredProjects.messages.LOAD_ERROR = this.props.intl.formatMessage(messages.error);
        if (this.props.placeholder) {
            this.featuredProjects.addPlaceholders();
        } else {
            this.featuredProjects.loadNextPage();
        }
        this.featuredProjects.onselect = this.handleSelect;
        this.el.appendChild(this.featuredProjects.root);
    }
    componentDidUpdate (prevProps) {
        if (prevProps.placeholder && !this.props.placeholder) {
            this.featuredProjects.loadNextPage();
        }
    }
    handleSelect (id) {
        this.props.onSelect(id);
    }
    ref (el) {
        this.el = el;
    }
    render () {
        return (
            <div
                className={classNames(
                    styles.wrapper
                )}
                ref={this.ref}
            />
        );
    }
}

FeaturedProjectsViewComponent.propTypes = {
    intl: intlShape.isRequired,
    placeholder: PropTypes.bool,
    onSelect: PropTypes.func.isRequired
};

export default injectIntl(FeaturedProjectsViewComponent);
