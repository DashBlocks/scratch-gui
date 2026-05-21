import PropTypes from 'prop-types';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './admin.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import Input from '../../components/forms/input.jsx';
import BufferedInputHOC from '../../components/forms/buffered-input-hoc.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';
import getSession from '../../lib/session.js';

/* eslint-disable react/jsx-no-literals */

const BufferedInput = BufferedInputHOC(Input);

const theme = detectTheme();
applyGuiColors(theme);

const messages = defineMessages({
    deletedOnlyFromProfile: {
        defaultMessage: 'Project deleted from profile, but it still accessable via ID - full deletion requested',
        description: 'Message displayed when a project is only deleted from the target\'s profile',
        id: 'dash.admin.deletedOnlyFromProfile'
    },
    banUser: {
        defaultMessage: 'Ban user',
        description: 'Option to ban user in action select in admin panel',
        id: 'dash.admin.manage.banUser'
    },
    banIp: {
        defaultMessage: 'Ban IP',
        description: 'Option to ban IP in action select in admin panel',
        id: 'dash.admin.manage.banIp'
    },
    unbanUser: {
        defaultMessage: 'Unban user',
        description: 'Option to unban user in action select in admin panel',
        id: 'dash.admin.manage.unbanUser'
    },
    unbanIp: {
        defaultMessage: 'Unban IP',
        description: 'Option to unban IP in action select in admin panel',
        id: 'dash.admin.manage.unbanIp'
    },
    promote: {
        defaultMessage: 'Promote',
        description: 'Option to promote user in action select in admin panel',
        id: 'dash.admin.manage.promote'
    },
    dasher: {
        defaultMessage: 'Dasher',
        description: '"Dasher" role name',
        id: 'dash.user.role.dasher'
    },
    dasherPlus: {
        defaultMessage: 'Dasher+',
        description: '"Dasher+" role name',
        id: 'dash.user.role.dasherPlus'
    }
});

const Admin = (props) => {
    const [userData, setUserData] = useState(null);

    const [featureProjectId, setFeatureProjectId] = useState('');
    const [featureProjectButtonLoading, setFeatureProjectButtonLoading] = useState(false);

    const [unfeatureProjectId, setUnfeatureProjectId] = useState('');
    const [unfeatureProjectButtonLoading, setUnfeatureProjectButtonLoading] = useState(false);

    const [deleteProjectId, setDeleteProjectId] = useState('');
    const [deleteProjectButtonLoading, setDeleteProjectButtonLoading] = useState(false);

    const [targetUsername, setTargetUsername] = useState('');
    const [manageAction, setManageAction] = useState('ban-user');
    const [manageRole, setManageRole] = useState('dasher+');
    const [manageButtonLoading, setManageButtonLoading] = useState(false);

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
            setUserData(session);
            setLoading(false);
        };

        fetchFullProfile();
    }, []); // Let's say session won't change

    async function handleFeatureProject(projectId) {
        if (!projectId || featureProjectButtonLoading) return;

        setFeatureProjectButtonLoading(true);

        try {
            const res = await fetch(`https://dashblocks-server.vercel.app/featured-projects/${Number(projectId)}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            setFeatureProjectId('');
        } catch (error) {
            alert(`Error featuring project with ID ${projectId}: ${error.message}`);
        } finally {
            setFeatureProjectButtonLoading(false);
        }
    }

    async function handleUnfeatureProject(projectId) {
        if (!projectId || unfeatureProjectButtonLoading) return;

        setUnfeatureProjectButtonLoading(true);

        try {
            const res = await fetch(`https://dashblocks-server.vercel.app/featured-projects/${Number(projectId)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            setUnfeatureProjectId('');
        } catch (error) {
            alert(`Error unfeaturing project with ID ${projectId}: ${error.message}`);
        } finally {
            setUnfeatureProjectButtonLoading(false);
        }
    }

    async function handleDeleteProject(projectId) {
        if (!projectId || deleteProjectButtonLoading) return;

        setDeleteProjectButtonLoading(true);

        try {
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${Number(projectId)}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            if (res.status_code === 202)
                alert(props.intl.formatMessage(messages.deletedOnlyFromProfile));
            setDeleteProjectId('');
        } catch (error) {
            alert(`Error deleting project with ID ${projectId}: ${error.message}`);
        } finally {
            setDeleteProjectButtonLoading(false);
        }
    }

    async function handleManageUser() {
        if (!targetUsername || manageButtonLoading) return;

        setManageButtonLoading(true);

        try {
            const body = { targetUsername, action: manageAction };
            if (manageAction === 'promote') body.role = manageRole;

            const res = await fetch('https://dashblocks-server.vercel.app/admin/manage-user', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!data.ok) throw new Error(data.error);
            // Not clearing states to allow multiple actions on the same user
        } catch (error) {
            alert(`Error managing user ${targetUsername}: ${error.message}`);
        } finally {
            setManageButtonLoading(false);
        }
    }

    if (loading) return (
        <>
            <LazyMenuBar />
            <div className={styles.spinner}>
                <Spinner level={'primary'} large />
            </div>
            <Footer />
        </>
    );
    if (error) return (
        <>
            <LazyMenuBar />
            <div>Error: {error}</div>
            <Footer />
        </>
    );
    if (!userData) return (
        <>
            <LazyMenuBar />
            <div>Failed to load user data</div>
            <Footer />
        </>
    );
    if (userData.role !== 'dashteam') return (
        <>
            <LazyMenuBar />
            <div>Not an admin</div>
            <Footer />
        </>
    )

    return (
        <>
            <LazyMenuBar />
            <div
                className={styles.container}
                dir={props.isRtl ? 'rtl' : 'ltr'}
            >
                <div className={styles.adminWrapper}>
                    <div className={styles.section}>
                        <h2>
                            <FormattedMessage
                                defaultMessage="Admin Panel"
                                description="Title of /admin page"
                                id="dash.admin.title"
                            />
                        </h2>

                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Feature Project"
                                    description="Title of the feature project section in admin panel"
                                    id="dash.admin.featureProject.title"
                                />
                            </h2>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Project ID"
                                    description="Label for the project ID input in admin panel"
                                    id="dash.admin.projectId"
                                />
                                <BufferedInput
                                    value={featureProjectId}
                                    onSubmit={setFeatureProjectId}
                                    className={styles.input}
                                    type="number"
                                    min="1"
                                    step="1"
                                />
                            </div>
                            <Button
                                className={styles.button}
                                onClick={() => handleFeatureProject(featureProjectId)}
                            >
                                {featureProjectButtonLoading ? (
                                    <Spinner className={styles.spinner} small />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Feature"
                                        description="Label for feature button"
                                        id="dash.admin.featureProject.button"
                                    />
                                )}
                            </Button>
                        </div>

                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Unfeature Project"
                                    description="Title of the unfeature project section in admin panel"
                                    id="dash.admin.unfeatureProject.title"
                                />
                            </h2>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Project ID"
                                    description="Label for the project ID input in admin panel"
                                    id="dash.admin.projectId"
                                />
                                <BufferedInput
                                    value={unfeatureProjectId}
                                    onSubmit={setUnfeatureProjectId}
                                    className={styles.input}
                                    type="number"
                                    min="1"
                                    step="1"
                                />
                            </div>
                            <Button
                                className={styles.button}
                                onClick={() => handleUnfeatureProject(unfeatureProjectId)}
                            >
                                {unfeatureProjectButtonLoading ? (
                                    <Spinner className={styles.spinner} small />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Unfeature"
                                        description="Label for unfeature button"
                                        id="dash.admin.unfeatureProject.button"
                                    />
                                )}
                            </Button>
                        </div>

                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Delete Project"
                                    description="Title of the delete project section in admin panel"
                                    id="dash.admin.deleteProject.title"
                                />
                            </h2>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Project ID"
                                    description="Label for the project ID input in admin panel"
                                    id="dash.admin.projectId"
                                />
                                <BufferedInput
                                    value={deleteProjectId}
                                    onSubmit={setDeleteProjectId}
                                    className={styles.input}
                                    type="number"
                                    min="1"
                                    step="1"
                                />
                            </div>
                            <Button
                                className={styles.button}
                                onClick={() => handleDeleteProject(deleteProjectId)}
                            >
                                {deleteProjectButtonLoading ? (
                                    <Spinner className={styles.spinner} small />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Delete"
                                        description="Label for delete button"
                                        id="dash.admin.deleteProject.button"
                                    />
                                )}
                            </Button>
                        </div>

                        <div className={styles.section}>
                            <h2>
                                <FormattedMessage
                                    defaultMessage="Manage User"
                                    description="Title of the manage user section in admin panel"
                                    id="dash.admin.manageUser.title"
                                />
                            </h2>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Username"
                                    description="Label for the username input in admin panel"
                                    id="dash.admin.username"
                                />
                                <BufferedInput
                                    value={targetUsername}
                                    onSubmit={setTargetUsername}
                                    className={styles.input}
                                    type="text"
                                />
                            </div>
                            <div className={styles.label}>
                                <FormattedMessage
                                    defaultMessage="Action"
                                    description="Label for the action select in admin panel"
                                    id="dash.admin.manage.action"
                                />
                                <select
                                    value={manageAction}
                                    onChange={e => setManageAction(e.target.value)}
                                    className={styles.input}
                                >
                                    <option value="ban-user">
                                        {props.intl.formatMessage(messages.banUser)}
                                    </option>
                                    <option value="ban-ip">
                                        {props.intl.formatMessage(messages.banIp)}
                                    </option>
                                    <option value="unban-user">
                                        {props.intl.formatMessage(messages.unbanUser)}
                                    </option>
                                    <option value="unban-ip">
                                        {props.intl.formatMessage(messages.unbanIp)}
                                    </option>
                                    <option value="promote">
                                        {props.intl.formatMessage(messages.promote)}
                                    </option>
                                </select>
                            </div>
                            {manageAction === 'promote' && (
                                <div className={styles.label}>
                                    <FormattedMessage
                                        defaultMessage="Role"
                                        description="Label for the role select in admin panel"
                                        id="dash.admin.manage.role"
                                    />
                                    <select
                                        value={manageRole}
                                        onChange={e => setManageRole(e.target.value)}
                                        className={styles.input}
                                    >
                                        <option value="dasher">
                                            {props.intl.formatMessage(messages.dasher)}
                                        </option>
                                        <option value="dasher+">
                                            {props.intl.formatMessage(messages.dasherPlus)}
                                        </option>
                                    </select>
                                </div>
                            )}
                            <Button
                                className={styles.button}
                                onClick={handleManageUser}
                            >
                                {manageButtonLoading ? (
                                    <Spinner className={styles.spinner} small />
                                ) : (
                                    <FormattedMessage
                                        defaultMessage="Manage"
                                        description="Label for manage user button"
                                        id="dash.admin.manageUser.button"
                                    />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

Admin.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedAdmin = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Admin));

const WrappedAdmin = AppStateHOC(ConnectedAdmin);

render(<WrappedAdmin />);
