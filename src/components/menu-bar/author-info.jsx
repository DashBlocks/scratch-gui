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
    username,
    isDashProject
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
            {!isDashProject ? <a
                className={styles.link}
                href={`https://scratch.mit.edu/projects/${projectId.replace('s', '')}`}
                target="_blank"
                rel="noreferrer"
            >
                <h1 className={styles.projectTitle}>
                    {projectTitle}
                </h1>
            </a> : <h1 className={styles.projectTitle}>
                {projectTitle}
            </h1>}
            <div>
                <span className={styles.usernameLine}>
                    <FormattedMessage
                        defaultMessage="by {author}"
                        description="Shows that a project was created by this user"
                        id="tw.studioview.authorAttribution"
                        values={{
                            author: (
                                <a
                                    className={styles.link}
                                    href={isDashProject ? `${process.env.ROOT}user#${userId}` : `https://scratch.mit.edu/users/${username}`}
                                    target="_blank"
                                >
                                    <span className={styles.username}>{username}</span>
                                </a>
                            )
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
    username: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
    isDashProject: PropTypes.bool
};

const AuthorInfo = props => (
    props.projectId?.startsWith('s') ?
        <ActualAuthorInfo {...props} /> :
        <ActualAuthorInfo {...props} isDashProject={true} />
);
AuthorInfo.propTypes = {
    projectId: PropTypes.string
};

export default AuthorInfo;
