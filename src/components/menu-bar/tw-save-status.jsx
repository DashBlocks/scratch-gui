import {connect} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import InlineMessages from '../../containers/inline-messages.jsx';
import SB3Downloader from '../../containers/sb3-downloader.jsx';
import {filterInlineAlerts} from '../../reducers/alerts';

import styles from './save-status.css';
import saveIcon from './dash-save.svg';

const TWSaveStatus = ({
    alertsList,
    fileHandle,
    projectChanged,
    showSaveFilePicker
}) => (
    filterInlineAlerts(alertsList).length > 0 ? (
        <InlineMessages />
    ) : projectChanged && (
        <SB3Downloader
            showSaveFilePicker={showSaveFilePicker}
        >
            {(_className, _downloadProjectCallback, {smartSave}) => (
                <div
                    onClick={smartSave}
                    className={styles.saveNow}
                >
                    <img
                        src={saveIcon}
                        draggable={false}
                        width={20}
                        height={20}
                    />
                    {fileHandle && (
                        <span>{fileHandle.name}</span>
                    )}
                </div>
            )}
        </SB3Downloader>
    ));

TWSaveStatus.propTypes = {
    alertsList: PropTypes.arrayOf(PropTypes.object),
    fileHandle: PropTypes.shape({
        name: PropTypes.string
    }),
    projectChanged: PropTypes.bool,
    showSaveFilePicker: PropTypes.func
};

const mapStateToProps = state => ({
    alertsList: state.scratchGui.alerts.alertsList,
    fileHandle: state.scratchGui.tw.fileHandle,
    projectChanged: state.scratchGui.projectChanged
});

export default connect(
    mapStateToProps,
    () => ({})
)(TWSaveStatus);
