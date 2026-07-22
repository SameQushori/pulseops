import { Link } from 'react-router-dom';

import styles from '../Page.module.css';
import { Button } from '../../shared/ui/Button/Button';

interface NotFoundPageProps {
  withinApp?: boolean;
}

export function NotFoundPage({ withinApp = false }: NotFoundPageProps) {
  const content = (
    <div className={styles.page}>
      <p className={styles.eyebrow}>404 · Route unavailable</p>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.description}>
        The requested PulseOps route does not exist.
      </p>
      <div>
        <Button asChild>
          <Link to={withinApp ? '/app/overview' : '/'}>
            {withinApp ? 'Return to overview' : 'Return home'}
          </Link>
        </Button>
      </div>
    </div>
  );

  return withinApp ? (
    content
  ) : (
    <main className={styles.standalone}>{content}</main>
  );
}
