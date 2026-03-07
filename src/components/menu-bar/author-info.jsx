import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import {FormattedMessage} from 'react-intl';
import UserAvatar from './user-avatar.jsx';

import styles from './author-info.css';

const ActualAuthorInfo = ({
    className,
    imageUrl,
    projectTitle,
    userId,
    projectId,
    username
}) => (
    <div
        className={classNames(
            className,
            styles.authorInfo
        )}
    >
        <UserAvatar
            className={styles.avatar}
            imageUrl={imageUrl}
        />
        <div className={styles.titleAuthor}>
            <h1 className={styles.projectTitle}>
                {projectTitle}
            </h1>
            <div>
                <span className={styles.usernameLine}>
                    <FormattedMessage
                        defaultMessage="by {username}"
                        description="Shows that a project was created by this user"
                        id="tw.studioview.authorAttribution"
                        values={{
                            username: <a href={`${process.env.ROOT}user.html#${userId}`}><span className={styles.username}>{username}</span></a>
                        }}
                    />
                </span>
            </div>
        </div>
    </div>
);

ActualAuthorInfo.propTypes = {
    className: PropTypes.string,
    imageUrl: PropTypes.string,
    projectTitle: PropTypes.string,
    userId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    projectId: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    username: PropTypes.oneOfType([PropTypes.string, PropTypes.bool])
};

const AuthorInfo = ({projectId, ...props}) => (
    projectId && projectId.startsWith('s') ? (
        <a
            className={styles.link}
            href={`https://scratch.mit.edu/projects/${projectId}`}
            target="_blank"
            rel="noreferrer"
        >
            <ActualAuthorInfo {...props} />
        </a>
    ) : <ActualAuthorInfo {...props} />
);
AuthorInfo.propTypes = {
    projectId: PropTypes.string
};

export default AuthorInfo;
