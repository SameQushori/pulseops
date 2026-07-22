import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

import { Button } from '../../shared/ui/Button/Button';
import { ErrorState } from '../../shared/ui/ErrorState/ErrorState';
import { LoadingState } from '../../shared/ui/LoadingState/LoadingState';
import styles from '../../pages/Page.module.css';

export function RouteLoading() {
  return (
    <div className={styles.page}>
      <LoadingState label="Loading the requested PulseOps workspace" />
    </div>
  );
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : error instanceof Error
      ? error.message
      : 'The requested view could not be loaded.';

  return (
    <div className={styles.page}>
      <ErrorState
        headingLevel={1}
        title="Workspace unavailable"
        description={message}
        action={
          <Button asChild>
            <Link to="/app/overview">Return to Overview</Link>
          </Button>
        }
      />
    </div>
  );
}
