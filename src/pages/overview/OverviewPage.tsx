import { useEffect, useMemo } from 'react';
import { Activity, Gauge, RadioTower, Siren } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { useGetOverviewQuery } from '../../features/overview-data/api/overviewApi';
import { applySimulationOverlay } from '../../features/incident-simulation/lib/applySimulationOverlay';
import { selectSimulation } from '../../features/incident-simulation/model/simulationSelectors';
import { SIMULATED_INCIDENT_ID } from '../../features/incident-simulation/model/simulationScenario';
import { startSimulation } from '../../features/incident-simulation/model/simulationSlice';
import { SimulationControls } from '../../features/incident-simulation/ui/SimulationControls';
import { selectTimeRange } from '../../features/time-range/model/preferencesSlice';
import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import { normalizeApiError } from '../../shared/api/normalizeApiError';
import { Button } from '../../shared/ui/Button/Button';
import { EmptyState } from '../../shared/ui/EmptyState/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState/ErrorState';
import { ActivityFeed } from './components/ActivityFeed';
import { MetricCard } from './components/MetricCard';
import { OverviewHeader } from './components/OverviewHeader';
import { OverviewSkeleton } from './components/OverviewSkeleton';
import { PerformanceChart } from './components/PerformanceChart';
import { ServiceHealthList } from './components/ServiceHealthList';
import { filterMetricPoints } from './lib/filterMetricPoints';
import {
  formatErrorRate,
  formatIncidentCount,
  formatLatency,
  formatThroughput,
} from './lib/formatOverviewValue';
import styles from './OverviewPage.module.css';

export function OverviewPage() {
  const { data, error, isLoading, refetch } = useGetOverviewQuery();
  const dispatch = useAppDispatch();
  const simulation = useAppSelector(selectSimulation);
  const timeRange = useAppSelector(selectTimeRange);
  const [searchParams, setSearchParams] = useSearchParams();
  const overview = useMemo(
    () => (data ? applySimulationOverlay(data, simulation) : undefined),
    [data, simulation],
  );
  const baselinePoint = data?.metrics.at(-1);

  useEffect(() => {
    if (searchParams.get('demo') !== 'start' || !baselinePoint) return;
    dispatch(startSimulation({ baselinePoint }));
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('demo');
    setSearchParams(nextParams, { replace: true });
  }, [baselinePoint, dispatch, searchParams, setSearchParams]);

  if (isLoading) return <OverviewSkeleton />;

  if (error || !data || !overview) {
    const normalized = normalizeApiError(error);
    return (
      <section className={styles.page} aria-labelledby="overview-title">
        <div>
          <p className={styles.eyebrow}>System workspace</p>
          <h1 className={styles.title} id="overview-title">
            Overview
          </h1>
        </div>
        <ErrorState
          className={`${styles.pageState} ${styles.errorPageState}`}
          title="Overview unavailable"
          description={normalized.message}
          action={<Button onClick={() => void refetch()}>Retry request</Button>}
        />
      </section>
    );
  }

  const isFullyEmpty =
    overview.services.length === 0 &&
    overview.metrics.length === 0 &&
    overview.recentEvents.length === 0;
  const visibleMetricPoints = filterMetricPoints(overview.metrics, timeRange);
  const simulationNeedsAttention = !['idle', 'resolved'].includes(
    simulation.phase,
  );
  const simulationTone = simulationNeedsAttention ? 'warning' : 'stable';

  return (
    <section className={styles.page} aria-labelledby="overview-title">
      <OverviewHeader status={overview.status} />

      {isFullyEmpty ? (
        <EmptyState
          className={styles.pageState}
          title="No overview data yet"
          description="The simulated environment is connected, but it has not returned metrics, services or activity for this snapshot."
        />
      ) : (
        <>
          {baselinePoint ? (
            <SimulationControls baselinePoint={baselinePoint} />
          ) : null}

          <div
            className={styles.metricGrid}
            aria-label="Key performance indicators"
          >
            <MetricCard
              context="Current response time at the 95th percentile"
              icon={Gauge}
              label="P95 latency"
              tone={simulationTone}
              value={formatLatency(overview.kpis.latencyMs)}
            />
            <MetricCard
              context="Requests returning an error in the latest snapshot"
              icon={Activity}
              label="Error rate"
              tone={simulationTone}
              value={formatErrorRate(overview.kpis.errorRate)}
            />
            <MetricCard
              context="Requests processed per minute"
              icon={RadioTower}
              label="Throughput"
              value={formatThroughput(overview.kpis.throughput)}
            />
            <MetricCard
              context="Incidents that are not resolved"
              href="/app/incidents"
              icon={Siren}
              label="Active incidents"
              tone={simulationTone}
              value={formatIncidentCount(overview.kpis.activeIncidents)}
            />
          </div>

          <div className={styles.primaryGrid}>
            <PerformanceChart
              points={visibleMetricPoints}
              timeRange={timeRange}
            />
            <ActivityFeed
              events={overview.recentEvents}
              nonNavigableIncidentId={SIMULATED_INCIDENT_ID}
            />
          </div>

          <ServiceHealthList services={overview.services} />

          <nav
            className={styles.secondaryNavigation}
            aria-label="Overview resources"
          >
            <Button asChild variant="secondary">
              <Link to="/app/incidents">View all incidents</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/app/services">View all services</Link>
            </Button>
          </nav>
        </>
      )}
    </section>
  );
}
