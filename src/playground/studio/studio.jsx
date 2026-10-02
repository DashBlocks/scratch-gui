import PropTypes from 'prop-types';
import React, {useState, useEffect, useRef} from 'react';
import useHashId from '../user/use-hash-id.jsx';
import {connect} from 'react-redux';
import {FormattedDate, FormattedMessage, defineMessages, injectIntl, intlShape} from 'react-intl';
import AppStateHOC from '../../lib/app-state-hoc.jsx';
import render from '../app-target';
import styles from './studio.css';

import Spinner from '../../components/spinner/spinner.jsx';
import {Footer} from '../render-interface.jsx';
import Button from '../../components/button/button.jsx';
import Input from '../../components/forms/input.jsx';
import BufferedInputHOC from '../../components/forms/buffered-input-hoc.jsx';
import Divider from '../../components/divider/divider.jsx';
import LazyMenuBar from '../../components/menu-bar/lazy-menu-bar.jsx';
import FramedAvatar from '../../components/dash-framed-avatar/framed-avatar.jsx';
import {APP_NAME} from '../../lib/brand';
import getSession, {requestDashApi} from '../../lib/dash-api.js';
import decorate from '../../lib/decorate-text.jsx';
import {applyGuiColors} from '../../lib/themes/guiHelpers';
import {detectTheme} from '../../lib/themes/themePersistance';

/* eslint-disable react/jsx-no-literals */

const theme = detectTheme();
applyGuiColors(theme);
const BufferedInput = BufferedInputHOC(Input);

const messages = defineMessages({
    title: {
        defaultMessage: '{studio} ({projectsCount})',
        description: 'Title of /studio page',
        id: 'dash.studio.title'
    },
    hoverText: {
        defaultMessage: '{title} by {author}',
        description: 'Displayed when hovering on a project',
        id: 'tw.studioview.hoverText'
    },
    confirmRemoveProject: {
        defaultMessage: 'Remove "{name}" from this studio?',
        description: 'Confirmation before removing a project from the studio',
        id: 'dash.studio.confirmRemoveProject'
    },
    descriptionPlaceholder: {
        defaultMessage: 'This studio has no description...',
        description: 'Placeholder for a studio description when blank',
        id: 'dash.studio.description.placeholder'
    },
    descriptionInputPlaceholder: {
        defaultMessage: 'What is this studio about?',
        description: 'Placeholder for the studio description input when blank',
        id: 'dash.studio.description.inputPlaceholder'
    }
});

const Studio = props => {
    const id = useHashId();
    const [studioData, setStudioData] = useState(null);
    const [projects, setProjects] = useState([]);
    const [session, setSession] = useState(null);
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editAllowProjects, setEditAllowProjects] = useState(false);
    const [projectUrl, setProjectUrl] = useState('');
    const [addingProject, setAddingProject] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [actionError, setActionError] = useState(null);
    const [removingProjectIds, setRemovingProjectIds] = useState([]);
    const [thumbnailCacheBuster, setThumbnailCacheBuster] = useState(Date.now());
    const [limit, _] = useState(40);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadMoreButtonDisabled, setLoadMoreButtonDisabled] = useState(false);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const thumbnailInputRef = useRef(null);
    const isOwner = studioData && String(session?.id) === String(studioData.owner.id);

    const fetchProjects = async (currentOffset, replace = false) => {
        setLoadMoreButtonDisabled(true);
        try {
            const projectsRes = await requestDashApi(`/studios/${id}/projects?limit=${limit}&offset=${currentOffset}`, {
                credentials: 'include'
            });
            if (!projectsRes.ok) throw new Error('Failed to fetch projects');
            const projectsData = await projectsRes.json();
            if (!projectsData.ok) throw new Error(projectsData.error);
            setProjects(prevProjects => (
                replace ? projectsData.projects : [...prevProjects, ...projectsData.projects]
            ));
            setHasMore(projectsData.projects.length === limit);
        } catch (catchedError) {
            setError(catchedError.message);
        } finally {
            setLoading(false);
            setLoadMoreButtonDisabled(false);
        }
    };

    const handleSaveStudio = async event => {
        event.preventDefault();
        setSaving(true);
        setActionError(null);
        try {
            const response = await requestDashApi(`/studios/${id}`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    name: editName,
                    description: editDescription,
                    allowProjects: editAllowProjects
                }),
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.error || 'Failed to update studio');
            setStudioData(data.studio);
            setEditing(false);
            document.title = `${props.intl.formatMessage(messages.title, {
                studio: data.studio.name,
                projectsCount: data.studio.projectsCount
            })} - ${APP_NAME}`;
        } catch (saveError) {
            setActionError(saveError.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUploadThumbnail = async event => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file) return;

        const formData = new FormData();
        formData.append('thumbnail', file);
        setUploading(true);
        setActionError(null);
        try {
            const response = await requestDashApi(`/studios/${id}/upload-thumbnail`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.error || 'Failed to upload studio thumbnail');
            setStudioData(previous => ({
                ...previous,
                thumbnailId: data.thumbnailId,
                updatedAt: new Date().toISOString()
            }));
            setThumbnailCacheBuster(Date.now());
        } catch (uploadError) {
            setActionError(uploadError.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveProject = async project => {
        // eslint-disable-next-line no-alert
        if (!window.confirm(props.intl.formatMessage(messages.confirmRemoveProject, {name: project.name}))) return;
        setRemovingProjectIds(previous => [...previous, project.id]);
        setActionError(null);
        try {
            const response = await requestDashApi(`/studios/${id}/projects/${project.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.ok) throw new Error(data.error || 'Failed to remove project');
            setProjects(previous => previous.filter(entry => entry.id !== project.id));
            setStudioData(previous => ({
                ...previous,
                projectsCount: Math.max(0, previous.projectsCount - 1),
                updatedAt: new Date().toISOString()
            }));
        } catch (removeError) {
            setActionError(removeError.message);
        } finally {
            setRemovingProjectIds(previous => previous.filter(idToRemove => idToRemove !== project.id));
        }
    };

    const handleAddProject = async event => {
        event.preventDefault();
        setAddingProject(true);
        setActionError(null);
        try {
            if (!session) {
                window.open('./login', '_self');
                return;
            }
            const projectId = Number(projectUrl.split('#')[1]);
            if (!projectId) throw new Error('Invalid project URL');
            const response = await requestDashApi(`/studios/${id}/projects`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({projectId}),
                credentials: 'include'
            });
            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data.error || 'Failed to add project');
            setProjectUrl('');
            setStudioData(previous => ({
                ...previous,
                projectsCount: previous.projectsCount + 1,
                updatedAt: new Date().toISOString()
            }));
            setProjects([]);
            setOffset(0);
            await fetchProjects(0, true);
        } catch (addError) {
            setActionError(addError.message);
        } finally {
            setAddingProject(false);
        }
    };

    useEffect(() => {
        setProjects([]);
        setHasMore(true);
        setOffset(0);
        setError(null);

        document.title = `${props.intl.formatMessage(messages.title, {
            studio: 'Studio',
            projectsCount: '?'
        })} - ${APP_NAME}`;

        setLoading(true);
        const fetchData = async () => {
            setSession(await getSession());
            const studioReq = await requestDashApi(`/studios/${id}`);
            if (!studioReq.ok) {
                setError('Failed to fetch studio data');
                setLoading(false);
                return;
            }
            const studio = await studioReq.json();
            if (!studio.ok) {
                setError(studio.error);
                setLoading(false);
                return;
            }
            document.title = `${props.intl.formatMessage(messages.title, {
                studio: studio.studio.name,
                projectsCount: studio.studio.projectsCount
            })} - ${APP_NAME}`;
            setStudioData(studio.studio);
            setEditName(studio.studio.name);
            setEditDescription(studio.studio.description || '');
            setEditAllowProjects(!!studio.studio.allowProjects);
            await fetchProjects(0);
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <>
                <LazyMenuBar />
                <div className={styles.spinner}>
                    <Spinner
                        level={'primary'}
                        large
                    />
                </div>
                <Footer />
            </>
        );
    }
    if (error) {
        return (
            <>
                <LazyMenuBar />
                <div>Error: {error}</div>
                <Footer />
            </>
        );
    }
    if (!studioData || !projects) {
        return (
            <>
                <LazyMenuBar />
                <div>Failed to load studio data</div>
                <Footer />
            </>
        );
    }

    const createdAt = studioData.createdAt ? new Date(studioData.createdAt) : null;
    const lastUpdated = studioData.updatedAt ? new Date(studioData.updatedAt) : null;

    return (
        <>
            <LazyMenuBar />
            <div
                className={styles.container}
                dir={props.isRtl ? 'rtl' : 'ltr'}
            >
                <div className={styles.studioWrapper}>
                    <div className={styles.section}>
                        <div className={styles.studioHeader}>
                            <img
                                className={styles.studioThumbnail}
                                src={`https://api.dashblocks.org/studios/thumbnails/${studioData.thumbnailId || studioData.id}?t=${thumbnailCacheBuster}`}
                                alt=""
                            />
                            {isOwner && (
                                <>
                                    <input
                                        ref={thumbnailInputRef}
                                        className={styles.hiddenInput}
                                        type="file"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onChange={handleUploadThumbnail}
                                    />
                                    <Button
                                        className={styles.thumbnailButton}
                                        disabled={uploading}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => thumbnailInputRef.current.click()}
                                    >
                                        {uploading ? (
                                            <FormattedMessage
                                                defaultMessage="Uploading thumbnail..."
                                                description="Studio thumbnail is being uploaded"
                                                id="dash.studio.uploadingThumbnail"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Change thumbnail"
                                                description="Upload a new studio thumbnail image"
                                                id="dash.studio.changeThumbnail"
                                            />
                                        )}
                                    </Button>
                                </>
                            )}
                            <div className={styles.studioDetails}>
                                {editing ? (
                                    <form
                                        className={styles.editForm}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onSubmit={handleSaveStudio}
                                    >
                                        <label htmlFor="studio-name">
                                            <FormattedMessage
                                                defaultMessage="Studio name"
                                                description="Studio name field label"
                                                id="dash.studio.name"
                                            />
                                        </label>
                                        <Input
                                            id="studio-name"
                                            maxLength="100"
                                            required
                                            value={editName}
                                            // eslint-disable-next-line react/jsx-no-bind
                                            onChange={event => setEditName(event.target.value)}
                                        />
                                        <label htmlFor="studio-description">
                                            <FormattedMessage
                                                defaultMessage="Description"
                                                description="Studio description label"
                                                id="dash.studio.description"
                                            />
                                        </label>
                                        <BufferedInput
                                            className={styles.descriptionField}
                                            id="studio-description"
                                            multiline
                                            maxLength="1000"
                                            rows="5"
                                            placeholder={props.intl.formatMessage(messages.descriptionInputPlaceholder)}
                                            value={editDescription}
                                            onSubmit={setEditDescription}
                                            disabled={saving}
                                        />
                                        <label className={styles.checkboxLabel}>
                                            <input
                                                type="checkbox"
                                                checked={editAllowProjects}
                                                // eslint-disable-next-line react/jsx-no-bind
                                                onChange={event => setEditAllowProjects(event.target.checked)}
                                            />
                                            <FormattedMessage
                                                defaultMessage="Anyone can add projects"
                                                description="Option to allow other users to add projects to the studio"
                                                id="dash.studio.allowProjects"
                                            />
                                        </label>
                                        <div className={styles.editActions}>
                                            <Button
                                                className={styles.button}
                                                disabled={saving}
                                                // eslint-disable-next-line react/jsx-no-bind
                                                onClick={handleSaveStudio}
                                            >
                                                {saving ? (
                                                    <FormattedMessage
                                                        defaultMessage="Saving..."
                                                        description="Studio changes are being saved"
                                                        id="dash.studio.saving"
                                                    />
                                                ) : (
                                                    <FormattedMessage
                                                        defaultMessage="Save changes"
                                                        description="Save studio edits"
                                                        id="dash.studio.saveChanges"
                                                    />
                                                )}
                                            </Button>
                                            <Button
                                                className={styles.button}
                                                disabled={saving}
                                                // eslint-disable-next-line react/jsx-no-bind
                                                onClick={() => {
                                                    setEditName(studioData.name);
                                                    setEditDescription(studioData.description || '');
                                                    setEditAllowProjects(!!studioData.allowProjects);
                                                    setEditing(false);
                                                }}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Cancel"
                                                    description="Cancel studio editing"
                                                    id="dash.studio.cancel"
                                                />
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className={styles.titleRow}>
                                            <h2>{studioData.name}</h2>
                                            {isOwner && (
                                                <Button
                                                    className={styles.button}
                                                    // eslint-disable-next-line react/jsx-no-bind
                                                    onClick={() => setEditing(true)}
                                                >
                                                    <FormattedMessage
                                                        defaultMessage="Edit studio"
                                                        description="Open studio editing controls"
                                                        id="dash.studio.edit"
                                                    />
                                                </Button>
                                            )}
                                        </div>
                                        <div className={styles.studioMeta}>
                                            <a
                                                className={styles.ownerLink}
                                                href={`user#${studioData.owner.id}`}
                                            >
                                                <FramedAvatar
                                                    avatarSrc={`https://api.dashblocks.org/users/avatars/${studioData.owner.profile.avatarId}`}
                                                    avatarClassName={styles.thumbnail}
                                                    className={styles.avatar}
                                                    frameId={studioData.owner.profile.avatarFrame}
                                                />
                                                <span>{studioData.owner.username}</span>
                                            </a>
                                            {createdAt && (
                                                <span>
                                                    <FormattedMessage
                                                        defaultMessage="Created {date}"
                                                        description="Studio creation date"
                                                        id="dash.studio.createdAt"
                                                        values={{date: <FormattedDate
                                                            value={createdAt}
                                                            year="numeric"
                                                            month="long"
                                                            day="numeric"
                                                        />}}
                                                    />
                                                </span>
                                            )}
                                            {lastUpdated && (
                                                <span>
                                                    <FormattedMessage
                                                        defaultMessage="Last updated {date}"
                                                        description="Studio last updated date"
                                                        id="dash.studio.lastUpdated"
                                                        values={{date: <FormattedDate
                                                            value={lastUpdated}
                                                            year="numeric"
                                                            month="long"
                                                            day="numeric"
                                                        />}}
                                                    />
                                                </span>
                                            )}
                                        </div>
                                        <p className={styles.description}>
                                            {studioData.description ?
                                                decorate(studioData.description, true) : (
                                                    <i>{props.intl.formatMessage(messages.descriptionPlaceholder)}</i>
                                                )
                                            }
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                        <main className={styles.studioMain}>
                            {actionError && <p className={styles.actionError}>{actionError}</p>}
                            <div className={styles.projectsTab}>
                                <h2>
                                    <FormattedMessage
                                        defaultMessage="Projects ({count})"
                                        description="Heading for projects in this studio"
                                        id="dash.studio.tabs.projects"
                                        values={{count: studioData.projectsCount}}
                                    />
                                </h2>
                            </div>
                            <Divider className={styles.divider} />
                            {(isOwner || studioData.allowProjects) && (
                                <form
                                    className={styles.addProjectForm}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onSubmit={handleAddProject}
                                >
                                    <Input
                                        className={styles.addProjectInput}
                                        type="text"
                                        required
                                        value={projectUrl}
                                        // Do not translate
                                        placeholder="https://dashblocks.org/#xxxx"
                                        disabled={addingProject}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onChange={event => setProjectUrl(event.target.value)}
                                    />
                                    <Button
                                        className={styles.button}
                                        type="submit"
                                        disabled={addingProject}
                                    >
                                        {addingProject ? (
                                            <FormattedMessage
                                                defaultMessage="Adding project..."
                                                description="Project is being added to the studio"
                                                id="dash.studio.addingProject"
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Add project"
                                                description="Add a project to the studio by URL"
                                                id="dash.studio.addProject"
                                            />
                                        )}
                                    </Button>
                                </form>
                            )}
                            <div className={styles.projectGrid}>
                                {projects.length > 0 ? projects.map(project => (
                                    <div
                                        key={project.id}
                                        className={styles.projectCard}
                                        title={props.intl.formatMessage(messages.hoverText, {
                                            author: project.author.username,
                                            title: project.name
                                        })}
                                    >
                                        <div className={styles.thumbWrapper}>
                                            <img
                                                draggable={false}
                                                src={`https://api.dashblocks.org/projects/thumbnails/${project.thumbnailId || 1}`}
                                                alt={project.id}
                                                // eslint-disable-next-line react/jsx-no-bind
                                                onClick={() => window.open(`./#${project.id}`, '_blank')}
                                            />
                                        </div>
                                        <div className={styles.projectInfo}>
                                            <h4
                                            // eslint-disable-next-line react/jsx-no-bind
                                                onClick={() => window.open(`./#${project.id}`, '_blank')}
                                            >{project.name}</h4>
                                            <p>
                                                <FormattedMessage
                                                    defaultMessage="by {author}"
                                                    description="Displayed under project title to credit creator"
                                                    id="tw.studioview.authorAttribution"
                                                    values={{
                                                        author: <a
                                                            href={`user#${project.author.id}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                        >{project.author.username}</a>
                                                    }}
                                                />
                                            </p>
                                            {(isOwner || String(session?.id) === String(project.author.id)) && (
                                                <Button
                                                    className={styles.removeProjectButton}
                                                    disabled={removingProjectIds.includes(project.id)}
                                                    // eslint-disable-next-line react/jsx-no-bind
                                                    onClick={() => handleRemoveProject(project)}
                                                >
                                                    {removingProjectIds.includes(project.id) ? (
                                                        <FormattedMessage
                                                            defaultMessage="Removing..."
                                                            description="Project is being removed from the studio"
                                                            id="dash.studio.removingProject"
                                                        />
                                                    ) : (
                                                        <FormattedMessage
                                                            defaultMessage="Remove"
                                                            description="Remove a project from the studio"
                                                            id="dash.studio.removeProject"
                                                        />
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )) : (
                                    <FormattedMessage
                                        defaultMessage="This studio has no projects"
                                        description="Placeholder text when the studio has no projects"
                                        id="dash.studio.projects.placeholder"
                                    />
                                )}
                                {hasMore && (
                                    <Button
                                        className={styles.loadMoreButton}
                                        disabled={loadMoreButtonDisabled}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => {
                                            const newOffset = offset + limit;
                                            setOffset(newOffset);
                                            fetchProjects(newOffset);
                                        }}
                                    >
                                        {loadMoreButtonDisabled ? (
                                            <Spinner
                                                className={styles.spinner}
                                                small
                                            />
                                        ) : (
                                            <FormattedMessage
                                                defaultMessage="Load more"
                                                description="Button text for loading more messages"
                                                id="dash.messages.loadMore"
                                            />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
                <Footer />
            </div>
        </>
    );
};

Studio.propTypes = {
    intl: intlShape,
    isRtl: PropTypes.bool
};

const mapStateToProps = state => ({
    isRtl: state.locales.isRtl
});

const mapDispatchToProps = () => ({});

const ConnectedStudio = injectIntl(connect(
    mapStateToProps,
    mapDispatchToProps
)(Studio));

const WrappedStudio = AppStateHOC(ConnectedStudio);

render(<WrappedStudio />);
