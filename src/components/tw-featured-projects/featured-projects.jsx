import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';
import {connect} from 'react-redux';
import FeaturedProjectsView from '../dash-featured-projects/featured-projects-view.jsx';
import styles from './featured-projects.css';
import {setProjectId} from '../../lib/tw-navigation-utils.js';
import classNames from 'classnames';

class FeaturedProjects extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleSelect',
            'handleOpenProjects'
        ]);
        this.state = {
            opened: false,
            transition: true
        };
    }
    componentDidUpdate (prevProps) {
        if (this.props.projectId === '0' && prevProps.projectId === null) {
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                opened: true,
                transition: false
            });
        }
    }
    handleSelect (id) {
        setProjectId(dispatchEvent, id);
    }
    handleOpenProjects () {
        this.setState({
            opened: true
        });
    }
    render () {
        const opened = this.state.opened;
        return (
            <div className={styles.container}>
                <div
                    className={classNames(
                        styles.projects,
                        {
                            [styles.opened]: opened,
                            [styles.transition]: this.state.transition
                        }
                    )}
                >
                    <FeaturedProjectsView
                        onSelect={this.handleSelect}
                        placeholder={!opened}
                    />
                    {opened ? null : (
                        <div
                            className={styles.openerContainer}
                            onClick={this.handleOpenProjects}
                        >
                            <div className={styles.openerContent}>
                                <FormattedMessage
                                    defaultMessage="Click to view featured projects."
                                    description="Text to view featured projects"
                                    id="tw.viewFeaturedProjects"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

FeaturedProjects.propTypes = {
    setProjectId: PropTypes.func,
    projectId: PropTypes.string
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId
});

const mapDispatchToProps = dispatch => ({
    setProjectId: projectId => setProjectId(dispatch, projectId)
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FeaturedProjects);
