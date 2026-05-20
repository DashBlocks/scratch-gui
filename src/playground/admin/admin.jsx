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
});

const Admin = (props) => {
    const [userData, setUserData] = useState(null);
    const [featureProjectId, setFeatureProjectId] = useState('');
    const [featureProjectButtonLoading, setFeatureProjectButtonLoading] = useState(false);

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
