import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage} from 'react-intl';

import {listenPresence} from '../../lib/dash-presence.js';
import sessionControl from '../../lib/dash-session-control.js';
import viewState from '../../lib/dash-view-state.js';
import activity from '../../lib/dash-activity.js';
import * as styles from './control-center.css';

/**
 * Floating status bar for collaboration: follow mode, presentation state
 * and the raise-hand button. Rendered by the GUI while a session is active.
 */
class FollowBar extends React.Component {
    constructor (props) {
        super(props);
        this.state = {tick: 0};
        this.unsubscribeList = [];
        bindAll(this, ['handleTick']);
    }
    componentDidMount () {
        this.unsubscribeList.push(sessionControl.subscribe(this.handleTick));
        this.unsubscribeList.push(viewState.subscribe(this.handleTick));
        this.unsubscribeList.push(listenPresence(this.props.vm, this.handleTick));
    }
    componentWillUnmount () {
        for (const unsubscribe of this.unsubscribeList) unsubscribe();
    }
    handleTick () {
        this.setState({tick: this.state.tick + 1});
    }
    render () {
        const presence = this.props.vm.dashCollaboration && this.props.vm.dashCollaboration.presence;
        const connected = Boolean(presence && presence.getMembers().length);
        const control = sessionControl.getState();
        const following = viewState.getFollowTarget();
        const followName = viewState.getFollowName();
        const hasSessionContent = connected || following || control.presentationActive;
        if (!hasSessionContent) return null;
        return (
            <div className={styles.followBar}>
                {following && (
                    <div className={styles.followChip}>
                        {'\u{1F441}'}
                        <span>
                            <FormattedMessage
                                defaultMessage="Following {name}"
                                description="Follow mode indicator"
                                id="dash.followBar.following"
                                values={{name: followName || '...'}}
                            />
                        </span>
                        <button
                            aria-label="stop following"
                            className={styles.followStop}
                            type="button"
                            onClick={() => viewState.setFollowTarget(null)}
                        >
                            {'\u2715'}
                        </button>
                    </div>
                )}
                {control.presentationActive && (
                    <div className={styles.followLive}>
                        {'\u{1F3A4} '}
                        {control.presenterName === 'self' ? (
                            <FormattedMessage
                                defaultMessage="You are presenting"
                                description="Live presentation indicator when the local user presents"
                                id="dash.followBar.presentingSelf"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="{name} presents"
                                description="Live presentation indicator"
                                id="dash.followBar.presenting"
                                values={{name: control.presenterName || '...'}}
                            />
                        )}
                    </div>
                )}
                {control.presentationActive && !control.presenting && control.presenterName !== 'self' && (
                    <button
                        className={`${styles.followButton} ${control.handRaised ? styles.followButtonRaised : ''}`}
                        type="button"
                        onClick={() => {
                            sessionControl.requestSpeech();
                            if (!control.handRaised) {
                                activity.recordSession({
                                    kind: 'speech',
                                    verb: 'raisedHand',
                                    icon: 'present',
                                    targetName: null
                                });
                            }
                        }}
                    >
                        {control.handRaised ? (
                            <FormattedMessage
                                defaultMessage="Hand raised ✓"
                                description="Button state: speech requested"
                                id="dash.followBar.handRaised"
                            />
                        ) : (
                            <FormattedMessage
                                defaultMessage="Raise hand"
                                description="Button to request speech"
                                id="dash.followBar.raiseHand"
                            />
                        )}
                    </button>
                )}
                {control.presenting && (control.handRaiseList || []).length > 0 && (
                    <div className={styles.followChip}>
                        {'\u{270B} '}
                        <FormattedMessage
                            defaultMessage="{count} raised hand(s)"
                            description="Number of raised hands for the presenter"
                            id="dash.followBar.handsCount"
                            values={{count: control.handRaiseList.length}}
                        />
                    </div>
                )}
            </div>
        );
    }
}

FollowBar.propTypes = {
    vm: PropTypes.object.isRequired
};

export default FollowBar;
