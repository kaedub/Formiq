import { useCallback, useEffect, useState, type JSX } from 'react';
import { Link } from 'react-router-dom';
import type { ProjectSummaryDto } from '@formiq/shared';
import { ProjectList } from '../components/ProjectList';
import styles from '../app.module.css';
import { API_BASE } from '../config';

export function HomePage(): JSX.Element {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) {
        throw new Error(`Failed to load projects: ${res.status}`);
      }
      const data = (await res.json()) as { projects: ProjectSummaryDto[] };
      setProjects(data.projects);
    } catch {
      setProjects([]);
      setError('Unable to load projects right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <div className={styles['home']}>
      <div className={styles['homeCard']}>
        <p className={styles['eyebrow']}>Project hub</p>
        <h1 className={styles['homeTitle']}>Your projects</h1>
        <p className={styles['lead']}>
          Start a new project to capture a goal and its context. Your saved work
          will appear here.
        </p>
        <div className={styles['homeActions']}>
          <Link to="/start" className={styles['primaryLink']}>
            Start New Project
          </Link>
        </div>
        <ProjectList projects={projects} loading={loading} error={error} />
      </div>
    </div>
  );
}

export default HomePage;
