import React, {useState, useRef, useEffect} from 'react';
import render from '../app-target';
import styles from './user.css';

import {APP_NAME} from '../../lib/brand';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);

const User = () => {
    const id = window.location.hash.replace('#', '');
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            try {
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
        const reader = new FileReader();
        reader.onload = async () => {
            await fetch("https://dashblocks-server.vercel.app/users/upload-avatar", {
                method: "POST",
                body: {
                    avatar: reader.result
                },
                credentials: "include"
            });
        };
        reader.readAsDataURL(e.target.files[0]);
    }

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!userData) return null;

    return (
        <div className={styles.userContainer}>
            <header className={styles.profileHeader}>
                <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.img,.gif"
                    ref={fileInputRef}
                    onChange={handleChangeAvatar}
                    style={{display: "none"}}
                />
                <img
                    src={`https://dashblocks-server.vercel.app/users/avatars/${userData.profile.avatarId}`}
                    alt={userData.username}
                    onClick={() => fileInputRef.current.click()}
                    className={styles.avatarImg}
                />
                <div className={styles.headerText}>
                    <h1 className={styles.username}>{userData.username}</h1>
                    <div className={styles.userInfo}>
                        <span className={styles.roleBadge}>{
                            userData.role === "dashteam" ? "Dash Team" :
                            (userData === "dasher+" ? "Dasher+" : "Dasher")
                        }</span>
                        <hr className={styles.divider} />
                        <p>Joined: <strong>{userData.joinedAt ? new Date(userData.joinedAt).toLocaleDateString() : "Unknown"}</strong></p>
                        <hr className={styles.divider} />
                        <p>Last Active: <strong>{userData.lastActive ? new Date(userData.lastActive).toLocaleDateString() : "Unknown"}</strong></p>
                    </div>
                </div>
            </header>

            <h2 className={styles.sectionTitle}>Projects ({userData.projects.length})</h2>
            <div className={styles.projectGrid}>
                {projects.map((project) => (
                    <div
                        key={project.id}
                        className={styles.projectCard}
                        onClick={() => window.open(`https://dashblocks.github.io/#${project.id}`, "_blank")}
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
    );
};

render(<User />)