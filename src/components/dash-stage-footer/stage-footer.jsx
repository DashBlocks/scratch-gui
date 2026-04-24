import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {useState, useEffect} from 'react';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';

import getSession from '../../lib/session';
import {setSession} from '../../reducers/dash';

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
    const [projectMetadata, setProjectMetadata] = useState(null);
    const [isFired, setIsFired] = useState(false);
    const [isDashProject, setIsDashProject] = useState(false);

    useEffect(() => {
        async function fetchProjectMetadata() {
            setIsDashProject(false);
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${props.projectId}`);
            const data = await res.json();
            if (data.ok) {
                setProjectMetadata(data.project);
                setIsDashProject(true);
            }
        }
        fetchProjectMetadata();
    }, [props.projectId]);

    useEffect(() => {
        function fetchFireStatus() {
            if (!props.session?.firedProjects) return;
            setIsFired(props.session.firedProjects.includes(+props.projectId));
        }
        fetchFireStatus();
    }, [props.session?.firedProjects || []]);

    async function updateSession() {
        const updatedSession = await getSession();
        setSession(updatedSession);
    }

    async function handleFireButtonClick() {
        if (!props.session) {
            window.open('./login', '_blank');
            return;
        }
        if (isFired) {
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${props.projectId}/fire`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setIsFired(false);
                setProjectMetadata(prevMetadata => ({
                    ...prevMetadata,
                    stats: {
                        ...prevMetadata.stats,
                        fires: data.fires
                    }
                }));
            }
        } else {
            const res = await fetch(`https://dashblocks-server.vercel.app/projects/${props.projectId}/fire`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            if (data.ok) {
                setIsFired(true);
                setProjectMetadata(prevMetadata => ({
                    ...prevMetadata,
                    stats: {
                        ...prevMetadata.stats,
                        fires: data.fires
                    }
                }));
            }
        }
        await updateSession();
    }

    if (!isDashProject || !props.projectId) return null;

    const fireButton = (
        <Button
            className={styles.fireButton}
            iconAlt={isFired ? props.intl.formatMessage(messages.unfire) : props.intl.formatMessage(messages.fire)}
            iconClassName={classNames(styles.fireReactionIcon, {
                [styles.fireReactionOffIcon]: !isFired
            })}
            iconSrc={isFired ? fireReactionOnIcon : fireReactionOffIcon}
            onClick={handleFireButtonClick}
            title={isFired ? props.intl.formatMessage(messages.unfire) : props.intl.formatMessage(messages.fire)}
        >
            {projectMetadata?.stats?.fires || 0}
        </Button>
    );

    return (
        <Box className={styles.stageFooterWrapper}>
            <div className={styles.footerButtonsRow}>
                <div className={styles.fireButtonWrapper}>
                    {fireButton}
                </div>
            </div>
        </Box>
    );
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId,
    session: state.scratchGui.dash.session
});

StageFooter.propTypes = {
    intl: intlShape,
    projectId: PropTypes.string,
    session: PropTypes.object
};

export default injectIntl(connect(
    mapStateToProps
)(StageFooter));
