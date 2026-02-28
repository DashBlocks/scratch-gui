import classNames from 'classnames';
import React, {useState, useRef, useEffect} from 'react';
import render from '../app-target';
import styles from './user.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

import getSession from '../../lib/session';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const User = () => {
    const id = window.location.hash.replace('#', '');
    const [session, setSession] = useState(null);
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [isMyProfile, setIsMyProfile] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            try {
                const session = await getSession();
                setIsMyProfile(session.userId.toString() === id);
                const userRes = await fetch(`https://dashblocks-server.vercel.app/users/${id}`);
                const userData = await userRes.json();

                if (!userData.ok) throw new Error(userData.error);
                document.title = `${userData.user.username} - ${APP_NAME}`
                setUserData(userData.user);

                const projects = userData.user.projects.slice(0, 10);
                setProjects(projects);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, [id]);

    async function handleChangeAvatar (e) {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        await fetch('https://dashblocks-server.vercel.app/users/upload-avatar', {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!userData) return null;

    return (
        <div className={styles.container}>
            <div className={styles.userWrapper}>
                <div className={classNames(styles.section, styles.userHeader)}>
                    <input
                        type='file'
                        accept='.png,.jpg,.jpeg,.img,.gif'
                        ref={fileInputRef}
                        onChange={handleChangeAvatar}
                        style={{display: 'none'}}
                    />
                    <img
                        src={`https://dashblocks-server.vercel.app/users/avatars/${userData.profile.avatarId}`}
                        alt={userData.username}
                        onClick={() => isMyProfile ? fileInputRef.current.click() : null}
                        className={styles.avatarImg}
                        style={isMyProfile ? {cursor: 'pointer'} : null}
                    />
                    <div className={styles.userInfo}>
                        <h2>{userData.username}</h2>
                        <div>
                            <span className={styles.roleBadge}>{
                                userData.role === 'dashteam' ? 'Dash Team' :
                                (userData === 'dasher+' ? 'Dasher+' : 'Dasher')
                            }</span>
                            <span>Joined: {userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : 'Unknown'}</span>
                            <span>Last Active: {userData.lastActive ? new Date(userData.lastActive).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Projects ({userData.projects.length})</h2>
                    <div className={styles.projectGrid}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className={styles.projectCard}
                                onClick={() => window.open(`https://dashblocks.github.io/#${project.id}`, '_blank')}
                            >
                                <div className={styles.thumbWrapper}>
                                    <img
                                        src={`https://dashblocks-server.vercel.app/projects/thumbnails/${project.thumbnailId || 1}`}
                                        alt={project.id}
                                    />
                                </div>
                                <div className={styles.projectInfo}>
                                    <h3>{project.name}</h3>
                                    <p>by {userData.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

render(<User />);
