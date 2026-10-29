import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import * as styles from './framed-avatar.css';

const FramedAvatar = ({
    avatarClassName,
    avatarSrc,
    className,
    frameId,
    ...props
}) => (
    <div
        className={classNames(styles.container, className)}
        {...props}
    >
        <img
            className={classNames(styles.avatar, {
                [styles.framedAvatar]: typeof frameId === 'string'
            }, avatarClassName)}
            draggable={false}
            src={avatarSrc}
        />
        {typeof frameId === 'string' && (
            <img
                className={styles.frame}
                draggable={false}
                src={`https://api.dashblocks.org/avatar-frames/${frameId}`}
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
