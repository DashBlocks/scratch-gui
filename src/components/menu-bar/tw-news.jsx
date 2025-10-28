import React from 'react';
import {APP_NAME} from '../../lib/brand';
import {isScratchDesktop} from '../../lib/isScratchDesktop';
import CloseButton from '../close-button/close-button.jsx';
import styles from './tw-news.css';

const getIsClosedInLocalStorage = (key, id) => {
    try {
        return localStorage.getItem(key) === id;
    } catch (e) {
        return false;
    }
};

const markAsClosedInLocalStorage = (key, id) => {
    try {
        localStorage.setItem(key, id);
    } catch (e) {
        // ignore
    }
};

class TWNews extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
            closed: getIsClosedInLocalStorage(props.key, props.id)
        };
        this.handleClose = this.handleClose.bind(this);
    }
    handleClose () {
        markAsClosedInLocalStorage(this.props.key, this.props.id);
        this.setState({
            closed: true
        }, () => {
            window.dispatchEvent(new Event('resize'));
        });
    }
    render () {
        if (this.state.closed || isScratchDesktop()) {
            return null;
        }
        return (
            <div className={styles.news}>
                {this.props.id == 'new-compiler' && (<div className={styles.text}>
                    {/* eslint-disable-next-line max-len */}
                    {`We rewrote the ${APP_NAME} compiler to make projects run even faster. Bugs are possible. `}
                    <a
                        href="https://docs.turbowarp.org/new-compiler"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {'Learn more.'}
                    </a>
                    {' '}
                    <a
                        href="https://dashblocks.github.io/old-compiler"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {'Old compiler.'}
                    </a>
                </div>)}
                {this.props.id == 'dev-version' && (<div className={styles.text}>
                    {/* eslint-disable-next-line max-len */}
                    {`This is a "Dev" version of ${APP_NAME}. Please do not use this version for real projects, as it may break your projects! `}
                    <a
                        href="https://dashblocks.github.io"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {'Main version.'}
                    </a>
                </div>)}
                <CloseButton
                    className={styles.close}
                    onClick={this.handleClose}
                />
            </div>
        );
    }
}

export default TWNews;
