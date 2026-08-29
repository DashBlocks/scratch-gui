import classNames from 'classnames';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import React, {useState} from 'react';
import {defineMessages, intlShape, injectIntl} from 'react-intl';
import {setProjectTitle} from '../../reducers/project-title';
import {requestDashApi} from '../../lib/dash-api';

import BufferedInputHOC from '../forms/buffered-input-hoc.jsx';
import Input from '../forms/input.jsx';
const BufferedInput = BufferedInputHOC(Input);

import styles from './project-title-input.css';

const messages = defineMessages({
    projectTitlePlaceholder: {
        id: 'gui.gui.projectTitlePlaceholder',
        description: 'Placeholder for project title when blank',
        defaultMessage: 'Project title here'
    }
});

const ProjectTitleInput = ({
    className,
    intl,
    onSubmit,
    projectTitle,
    projectId,
    session
}) => {
    const [saving, setSaving] = useState(false);

    const handleSubmit = title => {
        setSaving(true);
        Promise.resolve(onSubmit(title, projectId, session))
            .catch(error => {
                alert(error.message || error); // eslint-disable-line no-alert
            })
            .finally(() => setSaving(false));
    };

    return (
        <BufferedInput
            className={classNames(styles.titleField, className)}
            minLength="1"
            maxLength="100"
            placeholder={intl.formatMessage(messages.projectTitlePlaceholder)}
            tabIndex="0"
            type="text"
            value={projectTitle}
            // eslint-disable-next-line react/jsx-no-bind
            onSubmit={handleSubmit}
            disabled={saving}
        />
    );
};

ProjectTitleInput.propTypes = {
    className: PropTypes.string,
    intl: intlShape.isRequired,
    onSubmit: PropTypes.func,
    projectTitle: PropTypes.string,
    projectId: PropTypes.string,
    session: PropTypes.object
};

const mapStateToProps = state => ({
    projectTitle: state.scratchGui.projectTitle,
    projectId: state.scratchGui.projectState.projectId,
    session: state.scratchGui.dash.session
});

const mapDispatchToProps = dispatch => ({
    onSubmit: async (title, projectId, session) => {
        if (!session || !projectId || projectId === '0') {
            dispatch(setProjectTitle(title));
            return;
        }

        const res = await requestDashApi(`/projects/${projectId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: title}),
            credentials: 'include'
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
            throw new Error(data.error || 'Failed to update project name');
        }
        dispatch(setProjectTitle(data.project.name));
    }
});

export default injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(ProjectTitleInput));
