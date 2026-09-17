import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './framed-avatar.css';

const frames = Object.assign(Object.create(null), {});

const FramedAvatar = ({avatar, className, frameId}) => (
    <div className={classNames(styles.container, className)}>
        <img
            className={styles.avatar}
            draggable={false}
            src={avatar}
        />
        {typeof frameId === 'string' && frameId in frames && (
            <img
                className={styles.frame}
                draggable={false}
                src={frames[frameId]}
            />
        )}
    </div>
);

FramedAvatar.propTypes = {
    avatar: PropTypes.string,
    className: PropTypes.string,
    frameId: PropTypes.string
};

export default FramedAvatar;
