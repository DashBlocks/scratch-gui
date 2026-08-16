import React from 'react';
import PropTypes from 'prop-types';
import {FormattedMessage} from 'react-intl';

import styles from './description.css';
import decorate from '../../lib/decorate-text.jsx';

const Description = ({
    instructions,
    credits,
    isDashProject,
    projectId
}) => instructions !== 'unshared' && credits !== 'unshared' && (
    <div className={styles.description}>
        {isDashProject ? null : <div className={styles.projectLink}>
            <a
                href={`https://scratch.mit.edu/projects/${projectId}/`}
                target="_blank"
                rel="noreferrer"
            >
                <FormattedMessage
                    defaultMessage="View project on Scratch"
                    description="Link to view project on Scratch"
                    id="tw.viewOnScratch"
                />
            </a>
        </div>}
        {instructions ? (isDashProject ? (
            <div>
                <h2 className={styles.header}>
                    <FormattedMessage
                        defaultMessage="Description"
                        description="Header for description of Dash project"
                        id="dash.home.tab.description"
                    />
                </h2>
                {decorate(instructions, isDashProject)}
            </div>
        ) : (
            <div>
                <h2 className={styles.header}>
                    <FormattedMessage
                        defaultMessage="Instructions"
                        description="Header for instructions section of description"
                        id="tw.home.instructions"
                    />
                </h2>
                {decorate(instructions)}
            </div>
        )) : null}
        {instructions && credits && !isDashProject ? (
            <div className={styles.divider} />
        ) : null}
        {credits && !isDashProject ? (
            <div>
                <h2 className={styles.header}>
                    <FormattedMessage
                        defaultMessage="Notes and Credits"
                        description="Header for notes and credits section of description"
                        id="tw.home.credit"
                    />
                </h2>
                {decorate(credits)}
            </div>
        ) : null}
    </div>
);

Description.propTypes = {
    instructions: PropTypes.string,
    credits: PropTypes.string,
    isDashProject: PropTypes.bool,
    projectId: PropTypes.string
};

export default Description;
