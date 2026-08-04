import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import PropTypes from 'prop-types';
import React from 'react';
import Button from '../button/button.jsx';
import Spinner from '../../components/spinner/spinner.jsx';

import styles from './share-button.css';

const ShareButton = ({
    className,
    isShared,
    isSharing,
    onClick
}) => (
    <Button
        className={classNames(
            className,
            styles.shareButton,
            {[styles.shareButtonIsDisabled]: isSharing}
        )}
        onClick={onClick}
    >
        {isShared ? (
            <FormattedMessage
                defaultMessage="Update"
                description="Label for shared project"
                id="dash.menuBar.update"
            />
        ) : isSharing ? (
            <Spinner
                className={styles.spinner}
                small
            />
        ) : (
            <FormattedMessage
                defaultMessage="Share"
                description="Label for project share button"
                id="gui.menuBar.share"
            />
        )}
    </Button>
);

ShareButton.propTypes = {
    className: PropTypes.string,
    isShared: PropTypes.bool,
    isSharing: PropTypes.bool,
    onClick: PropTypes.func
};

ShareButton.defaultProps = {
    onClick: () => {}
};

export default ShareButton;
