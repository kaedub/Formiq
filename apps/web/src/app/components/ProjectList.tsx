import { Link } from 'react-router-dom';
import type { JSX } from 'react';
import type { ProjectSummaryDto } from '@formiq/shared';
import styles from '../app.module.css';

interface ProjectListProps {
  projects: ProjectSummaryDto[];
  loading: boolean;
  error: string | null;
}

const ProjectCard = ({
  project,
}: {
  project: ProjectSummaryDto;
}): JSX.Element => (
  <article className={styles['projectCard']}>
    <div className={styles['projectCardTop']}>
      <p className={styles['projectStatus']}>{project.status ?? 'unknown'}</p>
      <span className={styles['projectBadge']}>Project</span>
    </div>
    <h2 className={styles['projectTitleHome']}>{project.title}</h2>
    <div className={styles['projectCardActions']}>
      <Link to={`/projects/${project.id}`} className={styles['secondaryLink']}>
        Details
      </Link>
    </div>
  </article>
);

export const ProjectList = ({
  projects,
  loading,
  error,
}: ProjectListProps): JSX.Element => {
  if (loading) {
    return (
      <div className={styles['homePlaceholder']}>
        <p>Loading projects…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['homePlaceholder']}>
        <p>{error}</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className={styles['homePlaceholder']}>
        <p>No projects yet. Create one to see it here.</p>
      </div>
    );
  }

  return (
    <div className={styles['projectList']}>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

export default ProjectList;
