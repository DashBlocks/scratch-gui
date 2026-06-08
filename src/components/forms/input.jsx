import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import styles from './input.css';

const Input = props => {
    const {small, multiline, ...componentProps} = props;
    if (multiline) {
        return (
            <textarea
                {...componentProps}
                className={classNames(
                    styles.inputForm,
                    props.className,
                    {
                        [styles.inputSmall]: small
                    }
                )}
            />
        );
    }
    return (
        <input
            {...componentProps}
            className={classNames(
                styles.inputForm,
                props.className,
                {
                    [styles.inputSmall]: small
                }
            )}
        />
    );
};

Input.propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool,
    multiline: PropTypes.bool
};

Input.defaultProps = {
    small: false,
    multiline: false
};

export default Input;
