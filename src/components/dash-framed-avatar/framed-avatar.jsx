import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './framed-avatar.css';

const FRAMES = Object.assign(Object.create(null), {});

const FramedAvatar = ({
    avatarClassName,
    avatarSrc,
    className,
    frameId
}) => (
    <div className={classNames(styles.container, className)}>
        <img
            className={classNames(styles.avatar, avatarClassName)}
            draggable={false}
            src={avatar}
        />
        {typeof frameId === 'string' && frameId in FRAMES && (
            <img
                className={styles.frame}
                draggable={false}
                src={FRAMES[frameId]}
            />
        )}
    </div>
);

FramedAvatar.propTypes = {
    avatarClassName: PropTypes.string,
    avatarSrc: PropTypes.string,
    className: PropTypes.string,
    frameId: PropTypes.string
};

export default FramedAvatar;
