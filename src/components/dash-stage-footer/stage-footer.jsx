import classNames from 'classnames';
import {defineMessages, injectIntl, intlShape} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import {useState, useEffect} from 'react';
import {connect} from 'react-redux';

import Box from '../box/box.jsx';
import Button from '../button/button.jsx';

import {STAGE_DISPLAY_SIZES} from '../../lib/layout-constants.js';
import {getStageDimensions} from '../../lib/screen-utils.js';
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
    const {
        isFullScreen,
        isPlayerOnly,
        isEmbedded,
        projectId,
        stageSize,
        customStageSize
    } = props;
    const [session, setSession] = useState(null);
    const [projectMetadata, setProjectMetadata] = useState(null);
    const [isFired, setIsFired] = useState(false);
    const [isDashProject, setIsDashProject] = useState(false);

    let footer = null;

    if (isFullScreen || isEmbedded || !isPlayerOnly) return footer;

    const stageDimensions = getStageDimensions(stageSize, customStageSize, isFullScreen || isEmbedded);

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

    const fireButton = (
        <div className={styles.fireButtonWrapper}>
            <Button
                className={styles.fireButton}
                onClick={() => handleFireButtonClick(projectId)}
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
    );
    footer = (
        <Box
            className={classNames(styles.stageFooterWrapperOverlay)}
        >
            <Box
                className={styles.stageFooterWrapper}
                style={{width: stageDimensions.width}}
            >
                <div
                    className={styles.footerButtonsRow}
                    key="footer-buttons" // addons require the HTML element to be not be re-used by in-editor buttons
                >
                    {projectId && isDashProject ? fireButton : null}
                </div>
            </Box>
        </Box>
    );

    return footer;
};

const mapStateToProps = state => ({
    projectId: state.scratchGui.projectState.projectId,
    customStageSize: state.scratchGui.customStageSize
});

StageFooter.propTypes = {
    intl: intlShape,
    customStageSize: PropTypes.shape({
        width: PropTypes.number,
        height: PropTypes.number
    }),
    isFullScreen: PropTypes.bool.isRequired,
    isPlayerOnly: PropTypes.bool.isRequired,
    isEmbedded: PropTypes.bool.isRequired,
    stageSize: PropTypes.oneOf(Object.keys(STAGE_DISPLAY_SIZES))
};

export default injectIntl(connect(
    mapStateToProps
)(StageFooter));
