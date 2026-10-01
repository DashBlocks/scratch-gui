import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './framed-avatar.css';

import dashyFrame from './frames/dashy.svg';
import thornyCoreFrame from './frames/thorny-core.svg';
const FRAMES = Object.assign(Object.create(null), {
    'dashy': dashyFrame,
    'thorny-core': thornyCoreFrame
});

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
                [styles.framedAvatar]: typeof frameId === 'string' && frameId in FRAMES
            }, avatarClassName)}
            draggable={false}
            src={avatarSrc}
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
