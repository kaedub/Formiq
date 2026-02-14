import { useEffect, useState, type JSX } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ProjectContextProjectDto } from '@formiq/shared';
import styles from '../app.module.css';
import { API_BASE } from '../config';

export function ProjectDetailsPage(): JSX.Element {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<ProjectContextProjectDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProject = async (): Promise<void> => {
      if (!projectId) {
        setError('Missing project id.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/projects/${projectId}`);
        if (res.status === 404) {
          setError('Project not found.');
          setProject(null);
          return;
        }
        if (!res.ok) {
          throw new Error(`Failed to load project: ${res.status}`);
        }
        const data = (await res.json()) as {
          project: ProjectContextProjectDto;
        };
        setProject(data.project);
      } catch (err) {
        setError('Unable to load project details. Please try again.');
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

  return (
    <div className={styles['home']}>
      <div className={styles['homeCard']}>
        <p className={styles['eyebrow']}>Project detail</p>
        <h1 className={styles['homeTitle']}>
          {project ? project.title : `Project ${projectId ?? ''}`}
        </h1>
        {loading ? (
          <p className={styles['lead']}>Loading project…</p>
        ) : error ? (
          <p className={styles['lead']}>{error}</p>
        ) : project ? (
          <>
            <p className={styles['lead']}>
              Status: {project.status} · Responses captured:{' '}
              {project.responses.length}
            </p>
            <div className={styles['projectDetailsSection']}>
              <h2>Responses</h2>
              <ul className={styles['detailList']}>
                {project.responses.map((response) => (
                  <li key={response.answer.questionId}>
                    <strong>{response.question.prompt}</strong>
                    <div>
                      {response.answer.values.length > 0
                        ? response.answer.values.join(', ')
                        : 'No answer yet'}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {project.milestones.length > 0 && (
              <div className={styles['projectDetailsSection']}>
                <h2>Milestones</h2>
                <ul className={styles['detailList']}>
                  {project.milestones.map((milestone) => (
                    <li key={milestone.id}>
                      <strong>{milestone.title}</strong>
                      <div>{milestone.summary}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className={styles['lead']}>No project details to show.</p>
        )}
        <div className={styles['homeActions']}>
          <Link to="/" className={styles['primaryLink']}>
            Back to projects
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetailsPage;
