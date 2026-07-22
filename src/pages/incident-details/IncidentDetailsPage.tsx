import { skipToken } from '@reduxjs/toolkit/query';
import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '../../app/store/hooks';
import {
  useAddIncidentNoteMutation,
  useGetIncidentQuery,
  useUpdateIncidentMutation,
} from '../../entities/incident/api/incidentApi';
import {
  adaptApiIncidentDetails,
  adaptSimulatedIncidentDetails,
} from '../../entities/incident/model/incidentDetailsViewModel';
import {
  calculateIncidentResponseMetrics,
  formatIncidentDuration,
} from '../../entities/incident/model/incidentMetrics';
import type { AddIncidentNoteRequest } from '../../entities/incident/model/incidentNote';
import {
  getAllowedIncidentStatuses,
  INCIDENT_OWNERS,
} from '../../entities/incident/model/incidentWorkflow';
import { MetricPerformanceChart } from '../../entities/metric/ui/MetricPerformanceChart/MetricPerformanceChart';
import { useGetServiceQuery } from '../../entities/service/api/serviceApi';
import {
  selectSimulation,
  selectSimulatedIncident,
  selectSimulatedNotes,
  selectSimulatedTimeline,
} from '../../features/incident-simulation/model/simulationSelectors';
import {
  buildSimulatedMonitoringEvent,
  PAYMENTS_SERVICE_ID,
} from '../../features/incident-simulation/model/simulationScenario';
import {
  addSimulatedNote,
  assignSimulatedOwner,
  beginRecovery,
  identifySimulatedIncident,
} from '../../features/incident-simulation/model/simulationSlice';
import { normalizeApiError } from '../../shared/api/normalizeApiError';
import { Button } from '../../shared/ui/Button/Button';
import { EmptyState } from '../../shared/ui/EmptyState/EmptyState';
import { ErrorState } from '../../shared/ui/ErrorState/ErrorState';
import { SeverityBadge } from '../../shared/ui/SeverityBadge/SeverityBadge';
import { StatusBadge } from '../../shared/ui/StatusBadge/StatusBadge';
import { getIncidentStatusPresentation } from '../incidents/lib/formatIncident';
import { AddNoteDialog } from './components/AddNoteDialog';
import { IncidentNotes } from './components/IncidentNotes';
import { IncidentTimeline } from './components/IncidentTimeline';
import styles from './IncidentDetailsPage.module.css';

const timestampFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

function formatTimestamp(value: string | null) {
  return value
    ? `${timestampFormatter.format(new Date(value))} UTC`
    : 'Not available';
}

function IncidentDetailsSkeleton() {
  return (
    <section className={styles.skeleton} aria-label="Loading incident details">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonGrid}>
        <div />
        <div />
      </div>
    </section>
  );
}

type Feedback = {
  action: 'status' | 'owner' | 'note';
  tone: 'success' | 'error';
  message: string;
} | null;

export function IncidentDetailsPage() {
  const { incidentId } = useParams();
  const dispatch = useAppDispatch();
  const simulatedIncident = useAppSelector(selectSimulatedIncident);
  const simulatedTimeline = useAppSelector(selectSimulatedTimeline);
  const simulatedNotes = useAppSelector(selectSimulatedNotes);
  const simulation = useAppSelector(selectSimulation);
  const isSimulatedId =
    incidentId === 'incident-simulated-payments-degradation';
  const isSimulated = Boolean(isSimulatedId && simulatedIncident);
  const incidentQuery = useGetIncidentQuery(
    incidentId && !isSimulatedId ? incidentId : skipToken,
  );
  const serviceId = isSimulatedId
    ? PAYMENTS_SERVICE_ID
    : incidentQuery.data?.incident.serviceId;
  const serviceQuery = useGetServiceQuery(serviceId ?? skipToken);
  const [updateStatus, statusUpdateState] = useUpdateIncidentMutation();
  const [updateOwner, ownerUpdateState] = useUpdateIncidentMutation();
  const [addNote, noteState] = useAddIncidentNoteMutation();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const noteTriggerRef = useRef<HTMLButtonElement>(null);

  const view = useMemo(() => {
    if (isSimulated && simulatedIncident) {
      return adaptSimulatedIncidentDetails({
        incident: simulatedIncident,
        service: serviceQuery.data?.service ?? null,
        timeline: simulatedTimeline,
        notes: simulatedNotes,
        metrics: [
          ...(serviceQuery.data?.metrics ?? []),
          ...simulation.appendedMetricPoints,
        ],
      });
    }
    if (incidentQuery.data) {
      return adaptApiIncidentDetails(
        incidentQuery.data,
        serviceQuery.data?.metrics ?? [],
      );
    }
    return null;
  }, [
    incidentQuery.data,
    isSimulated,
    serviceQuery.data,
    simulatedIncident,
    simulatedNotes,
    simulatedTimeline,
    simulation.appendedMetricPoints,
  ]);

  if (!isSimulatedId && incidentQuery.isLoading)
    return <IncidentDetailsSkeleton />;

  if (!view) {
    const resetMessage = isSimulatedId
      ? 'The demo incident is no longer available because the simulation was reset.'
      : normalizeApiError(incidentQuery.error).message;
    return (
      <ErrorState
        headingLevel={1}
        title="Incident not found"
        description={resetMessage}
        action={
          <div className={styles.stateActions}>
            <Button asChild variant="secondary">
              <Link to="/app/incidents">Return to Incidents</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/app/overview">Open Overview</Link>
            </Button>
          </div>
        }
      />
    );
  }

  const { incident } = view;
  const status = getIncidentStatusPresentation(incident.status);
  const allowedStatuses = getAllowedIncidentStatuses(incident.status).filter(
    (next) => view.source === 'api' || next !== 'resolved',
  );
  const metrics = calculateIncidentResponseMetrics(incident, view.timeline);
  const durationContext = incident.resolvedAt
    ? `Resolved after ${formatIncidentDuration(metrics.mttr)}.`
    : `Response remains ${status.label.toLowerCase()}; running duration is intentionally not calculated from wall-clock time.`;

  const changeStatus = async (nextStatus: string) => {
    setFeedback(null);
    if (
      !allowedStatuses.includes(nextStatus as (typeof allowedStatuses)[number])
    )
      return;
    if (view.source === 'simulation') {
      if (nextStatus === 'identified') dispatch(identifySimulatedIncident());
      if (nextStatus === 'monitoring')
        dispatch(beginRecovery(buildSimulatedMonitoringEvent(incident)));
      setFeedback({
        action: 'status',
        tone: 'success',
        message: `Status changed to ${nextStatus}.`,
      });
      return;
    }
    try {
      await updateStatus({
        id: incident.id,
        changes: { status: nextStatus as typeof incident.status },
      }).unwrap();
      setFeedback({
        action: 'status',
        tone: 'success',
        message: `Status changed to ${nextStatus}.`,
      });
    } catch (error) {
      setFeedback({
        action: 'status',
        tone: 'error',
        message: normalizeApiError(error).message,
      });
    }
  };

  const changeOwner = async (ownerValue: string) => {
    const owner = ownerValue || null;
    setFeedback(null);
    if (view.source === 'simulation') {
      dispatch(assignSimulatedOwner(owner));
      setFeedback({
        action: 'owner',
        tone: 'success',
        message: `Owner changed to ${owner ?? 'Unassigned'}.`,
      });
      return;
    }
    try {
      await updateOwner({ id: incident.id, changes: { owner } }).unwrap();
      setFeedback({
        action: 'owner',
        tone: 'success',
        message: `Owner changed to ${owner ?? 'Unassigned'}.`,
      });
    } catch (error) {
      setFeedback({
        action: 'owner',
        tone: 'error',
        message: normalizeApiError(error).message,
      });
    }
  };

  const submitNote = async (note: AddIncidentNoteRequest) => {
    setFeedback(null);
    if (view.source === 'simulation') {
      dispatch(addSimulatedNote(note));
      setFeedback({
        action: 'note',
        tone: 'success',
        message: 'Incident note added.',
      });
      return true;
    }
    try {
      await addNote({ id: incident.id, note }).unwrap();
      setFeedback({
        action: 'note',
        tone: 'success',
        message: 'Incident note added.',
      });
      return true;
    } catch (error) {
      setFeedback({
        action: 'note',
        tone: 'error',
        message: normalizeApiError(error).message,
      });
      return false;
    }
  };

  return (
    <section className={styles.page} aria-labelledby="incident-details-title">
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/app/incidents">Incidents</Link>
        <span aria-hidden="true">/</span>
        <span>{incident.title}</span>
      </nav>
      <header className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>
            {incident.id}
            {view.source === 'simulation' ? ' · Demo incident' : ''}
          </p>
          <h1 id="incident-details-title">{incident.title}</h1>
          <p className={styles.description}>{incident.summary}</p>
          <div className={styles.badges}>
            <SeverityBadge severity={incident.severity} />
            <StatusBadge label={status.label} status={status.tone} />
          </div>
        </div>
        <div className={styles.actions} aria-label="Incident response actions">
          <label>
            Status
            <select
              aria-label="Incident status"
              value={incident.status}
              disabled={
                statusUpdateState.isLoading || allowedStatuses.length === 0
              }
              onChange={(event) => void changeStatus(event.target.value)}
            >
              <option value={incident.status}>{status.label}</option>
              {allowedStatuses.map((next) => (
                <option value={next} key={next}>
                  {getIncidentStatusPresentation(next).label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Owner
            <select
              aria-label="Incident owner"
              value={incident.owner ?? ''}
              disabled={ownerUpdateState.isLoading}
              onChange={(event) => void changeOwner(event.target.value)}
            >
              <option value="">Unassigned</option>
              {INCIDENT_OWNERS.map((owner) => (
                <option key={owner}>{owner}</option>
              ))}
            </select>
          </label>
          <Button
            ref={noteTriggerRef}
            onClick={() => {
              setFeedback(null);
              setNoteOpen(true);
            }}
          >
            Add note
          </Button>
        </div>
      </header>

      {feedback ? (
        <p
          className={
            feedback.tone === 'error'
              ? styles.feedbackError
              : styles.feedbackSuccess
          }
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className={styles.summaryGrid}>
        <section className={styles.panel}>
          <p className={styles.panelEyebrow}>Incident metadata</p>
          <dl className={styles.metadata}>
            <div>
              <dt>Service</dt>
              <dd>
                <Link to={`/app/services/${incident.serviceId}`}>
                  {view.serviceName}
                </Link>
              </dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{incident.owner ?? 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatTimestamp(incident.startedAt)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatTimestamp(incident.updatedAt)}</dd>
            </div>
            <div>
              <dt>Resolved</dt>
              <dd>{formatTimestamp(incident.resolvedAt)}</dd>
            </div>
          </dl>
        </section>
        <section className={styles.panel}>
          <p className={styles.panelEyebrow}>Impact and response</p>
          <h2>
            {incident.severity.toUpperCase()} impact on {view.serviceName}
          </h2>
          <p className={styles.context}>{incident.summary}</p>
          <dl className={styles.responseMetrics}>
            <div>
              <dt>MTTA</dt>
              <dd>{formatIncidentDuration(metrics.mtta)}</dd>
            </div>
            <div>
              <dt>MTTR</dt>
              <dd>{formatIncidentDuration(metrics.mttr)}</dd>
            </div>
          </dl>
          <p className={styles.context}>{durationContext}</p>
        </section>
      </div>

      <section
        className={`${styles.panel} ${styles.telemetry}`}
        aria-labelledby="telemetry-title"
      >
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.panelEyebrow}>Related telemetry</p>
            <h2 id="telemetry-title">Latency and error rate</h2>
          </div>
          <span>{view.serviceName} · incident context</span>
        </div>
        {serviceQuery.isLoading ? (
          <p className={styles.neutralState} role="status">
            Loading related metrics…
          </p>
        ) : serviceQuery.isError ? (
          <ErrorState
            title="Metrics unavailable"
            description={normalizeApiError(serviceQuery.error).message}
            action={
              <Button
                variant="secondary"
                onClick={() => void serviceQuery.refetch()}
              >
                Retry metrics
              </Button>
            }
          />
        ) : view.metrics.length === 0 ? (
          <EmptyState
            title="No related metrics"
            description="No latency or error-rate points are available for this service."
          />
        ) : (
          <MetricPerformanceChart
            points={view.metrics}
            accessibleLabel={`Related latency and error rate for ${view.serviceName}`}
            description={`Service telemetry shown in UTC for the incident context. The incident started ${formatTimestamp(incident.startedAt)}.`}
          />
        )}
      </section>

      <div className={styles.detailsGrid}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Chronology</p>
              <h2>Timeline</h2>
            </div>
            <span>{view.timeline.length} events</span>
          </div>
          <IncidentTimeline events={view.timeline} />
        </section>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Response log</p>
              <h2>Notes</h2>
            </div>
          </div>
          <IncidentNotes notes={view.notes} />
        </section>
      </div>

      <AddNoteDialog
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        onSubmit={submitNote}
        pending={noteState.isLoading}
        error={
          feedback?.action === 'note' && feedback.tone === 'error'
            ? feedback.message
            : null
        }
        triggerRef={noteTriggerRef}
      />
    </section>
  );
}
