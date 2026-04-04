import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './mystuff.css';

import Spinner from '../../components/spinner/spinner.jsx';
import Button from '../../components/button/button.jsx';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import getSession from '../../lib/session.js';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
    confirmDeleteProject: {
        defaultMessage: 'Are you sure you want to delete {projectName}? This action CANNOT be undone!',
        description: 'Confirmation message when deleting a project',
        id: 'dash.mystuff.confirmDeleteProject'
    }
});

const User = (props) => {
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            const session = await getSession();
            if (!session || !session.userId) {
                setError('Not logged in');
                setLoading(false);
                return;
            }
            let userData;
            try {
                const userRes = await fetch(`https://dashblocks-server.vercel.app/users/${session.userId}`);
                userData = await userRes.json();
                if (!userData.ok) throw new Error(userData.error);
                setUserData(userData.user);

                const projects = userData.user.projects.slice(0, 10);
                setProjects(projects);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, []); // Let's say session won't change

    async function handleDeleteProject(projectId) {
        const project = projects.find(p => p.id === projectId);
        if (!project || !window.confirm(props.intl.formatMessage(messages.confirmDeleteProject, {projectName: project.name})))
            return;

        try {
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${projectId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);

            setProjects(projects.filter(p => p.id !== projectId));
        } catch (error) {
            alert(`Error deleting ${project.name} project: ${error.message}`);
        }
    }

    if (loading) return (
        <div className={styles.spinner}>
            <Spinner level={'primary'} large />
        </div>
    );
    if (error) return <div>Error: {error}</div>;
    if (!userData) return null;

    return (
        <div
            className={styles.container}
            dir={props.isRtl ? 'rtl' : 'ltr'}
        >
            <div className={styles.mystuffWrapper}>
                <div className={styles.section}>
                    <h2>
                        <FormattedMessage
                            defaultMessage="My Stuff"
                            description="Title of /mystuff page"
                            id="dash.mystuff.title"
                        />
                    </h2>
                    <div className={styles.projectGrid}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={styles.projectCard}
                            >
                                <div className={styles.thumbWrapper}>
                                    <img
                                        draggable={false}
                                        src={`https://dashblocks-server.vercel.app/projects/thumbnails/${project.thumbnailId || 1}`}
                                        alt={project.id}
                                    />
                                </div>
                                <div className={styles.projectInfo}>
                                    <h4
                                        onClick={() => window.open(`./#${project.id}`, '_blank')}
                                        title={props.intl.formatMessage(messages.hoverText, {
                                            author: userData.username,
                                            title: project.name
                                        })}
                                    >{project.name}</h4>
                                    <Button
                                        className={styles.seeInsideButton}
                                        onClick={() => window.open(`./editor.html#${project.id}`, '_blank')}
                                    >
                                        <FormattedMessage
                                            defaultMessage="See inside"
                                            description="Label for see inside button"
                                            id="tw.menuBar.seeInside"
                                        />
                                    </Button>
                                </div>
                                <div className={styles.projectStats}>
                                    <p>
                                        <FormattedMessage
                                            defaultMessage="{fires} fires" // TODO: Icon + count
                                            description="Number of fires for a project"
                                            id="dash.project.stats.fires"
                                            values={{
                                                fires: project.stats?.fires || 0
                                            }}
                                        />
                                    </p>
                                    <Button
                                        className={styles.deleteProjectButton}
                                        onClick={() => handleDeleteProject(project.id)}
                                    >
                                        <FormattedMessage
                                            defaultMessage="Delete"
                                            description="Label for delete project button"
                                            id="dash.mystuff.delete"
                                        />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

User.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedUser = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(User));

const WrappedUser = AppStateHOC(ConnectedUser, true);

render(<WrappedUser />);
