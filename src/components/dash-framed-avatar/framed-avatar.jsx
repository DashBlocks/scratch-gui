import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './framed-avatar.css';

const frames = Object.assign(Object.create(null), {});

const FramedAvatar = ({avatar, frameId}) => (
    <div className={styles.container}>
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
    frameId: PropTypes.string
};

export default FramedAvatar;
