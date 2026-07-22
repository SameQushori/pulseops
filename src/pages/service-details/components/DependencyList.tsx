import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { ServiceWithSimulation } from '../../../features/incident-simulation/lib/serviceSimulationOverlay';
import { serviceStatusPresentation } from '../../../entities/service/model/servicePresentation';
import { EmptyState } from '../../../shared/ui/EmptyState/EmptyState';
import { StatusBadge } from '../../../shared/ui/StatusBadge/StatusBadge';
import styles from '../ServiceDetailsPage.module.css';

export function DependencyList({
  dependencies,
}: {
  dependencies: ServiceWithSimulation[];
}) {
  if (dependencies.length === 0) {
    return (
      <EmptyState
        title="No direct dependencies"
        description="This service has no upstream dependencies in the monitored boundary."
      />
    );
  }
  return (
    <ul className={styles.contextList} aria-label="Direct dependencies">
      {dependencies.map((dependency) => {
        const status = serviceStatusPresentation[dependency.status];
        return (
          <li key={dependency.id}>
            <div>
              <Link to={`/app/services/${dependency.id}`}>
                {dependency.name}
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
              <p>{dependency.description}</p>
              {dependency.isSimulatedStatus ? (
                <span className={styles.simulationMarker}>
                  Simulated degradation
                </span>
              ) : null}
            </div>
            <StatusBadge label={status.label} status={status.tone} />
          </li>
        );
      })}
    </ul>
  );
}
