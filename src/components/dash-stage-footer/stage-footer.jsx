import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {useState, useEffect} from 'react';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';

import getSession from '../../lib/session';

import fireReactionOnIcon from './fire-reaction-on.svg';
import fireReactionOffIcon from './fire-reaction-off.svg';

import styles from './stage-footer.css';

const messages = defineMessages({
    fire: {
        defaultMessage: 'Fire Project',
        description: 'Button to trigger fire reaction',
        id: 'dash.project.fire'
    },
    unfire: {
        defaultMessage: 'Unfire Project',
        description: 'Button to trigger unfire reaction',
        id: 'dash.project.unfire'
    }
});

const StageFooter = (props) => {  
    const [session, setSession] = useState(null);
    const [projectMetadata, setProjectMetadata] = useState(null);
    const [isFired, setIsFired] = useState(false);
    const [isDashProject, setIsDashProject] = useState(false);

    useEffect(() => {
        async function fetchProjectMetadata() {
            setIsDashProject(false);
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${projectId}`);
            const data = await res.json();
            if (data.ok) {
                setProjectMetadata(data.project);
                setIsDashProject(true);
            }
        }
        async function fetchFireStatus() {
            const fetchedSession = await getSession();
            setSession(fetchedSession);
            setIsFired(fetchedSession?.firedProjects?.includes(projectId) || false);
        }
        fetchProjectMetadata();
        fetchFireStatus();
    }, [projectId]);

    async function handleFireButtonClick(projectId) {
        if (!session) {
            alert('Log in to fire this project');
            window.open('./login', '_blank');
            return;
        }
        if (isFired) {
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${projectId}/fire`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setIsFired(false);
            }
        } else {
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${projectId}/fire`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setIsFired(true);
            }
        }
    }

    return isDashProject && (
        <Box className={styles.stageFooterWrapper}>
            <div className={styles.footerButtonsRow}>
                {props.projectId && (
                    <div className={styles.fireButtonWrapper}>
                        <Button
                            className={styles.fireButton}
                            onClick={() => handleFireButtonClick(props.projectId)}
                        >
                            <img
                                alt={isFired ? props.intl.formatMessage(messages.unfire) : props.intl.formatMessage(messages.fire)}
                                className={styles.fireButtonIcon}
                                draggable={false}
                                src={isFired ? fireReactionOnIcon : fireReactionOffIcon}
                                title={isFired ? props.intl.formatMessage(messages.unfire) : props.intl.formatMessage(messages.fire)}
                            />
                            <p className={styles.fireCount}>
                                {projectMetadata?.stats?.fires || 0}
                            </p>
                        </Button>
                    </div>
                )}
            </div>
        </Box>
    );
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId
});

StageFooter.propTypes = {
    intl: intlShape,
    projectId: PropTypes.number
};

export default injectIntl(connect(
    mapStateToProps
)(StageFooter));
