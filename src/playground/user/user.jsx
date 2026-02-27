import React, {useState, useEffect} from 'react';
import render from '../app-target';
import styles from './user.css';
import {APP_NAME} from '../../lib/brand';

const User = () => {
    const id = window.location.hash.replace('#', '');
    const [userData, setUserData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchFullProfile = async () => {
            setLoading(true);
            try {
                const userRes = await fetch(`https://dashblocks-server.vercel.app/users/${id}`);
                const userData = await userRes.json();

                if (!userData.ok) throw new Error(userData.error);
                document.title = `${userData.user.username} - ${APP_NAME}`
                setUserData(userData.user);

                const projectDetailsPromises = userData.user.projects.slice(0, 10).map(async (project) => {
                    const projectRes = await fetch(`https://dashblocks-server.vercel.app/projects/${project.id}`);
                    const projectData = await projectRes.json();
                    return {...projectData.project};
                });

                const projects = await Promise.all(projectDetailsPromises);
                setProjects(projects);
            } catch (error) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchFullProfile();
    }, [id]);

    if (loading) return <div className={styles.loadingState}>Loading...</div>;
    if (error) return <div className={styles.errorState}>Error: {error}</div>;
    if (!userData) return null;

    const avatarUrl = `https://dashblocks-server.vercel.app/users/avatars/${userData.profile.avatarId}`;

    return (
        <div className={styles.userContainer}>
            <header className={styles.profileHeader}>
                <img src={avatarUrl} alt={userData.username} className={styles.avatarImg} />
                <div className={styles.headerText}>
                    <h1 className={styles.username}>{userData.username}</h1>
                    <span className={styles.roleBadge}>{userData.role}</span>
                </div>
            </header>

            <section className={styles.statsSection}>
                <p>Joined: <strong>{new Date(userData.joinedAt).toLocaleDateString()}</strong></p>
                <p>Last Active: <strong>{new Date(userData.lastActive).toLocaleDateString()}</strong></p>
            </section>

            <hr className={styles.divider} />

            <h2 className={styles.sectionTitle}>Projects</h2>
            <div className={styles.projectGrid}>
                {projects.map((project) => (
                    <div key={project.id} className={styles.projectCard}>
                        <div className={styles.thumbWrapper}>
                            <img
                                src={`https://dashblocks-server.vercel.app/projects/thumbnails/${project.thumbnailId}`}
                                alt={project.id}
                            />
                        </div>
                        <div className={styles.projectInfo}>
                            <h3>{project.name}</h3>
                            <p>by {project.author.username}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

render(<User />)