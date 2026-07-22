import { useState, type FormEvent, type KeyboardEvent } from 'react';

import type { Service } from '../../../entities/service/model/service';
import { Button } from '../../../shared/ui/Button/Button';
import {
  INCIDENT_QUERY_MAX_LENGTH,
  countActiveIncidentFilters,
  hasActiveIncidentFilters,
  type IncidentFiltersState,
} from '../model/incidentFilters';
import styles from './IncidentFilters.module.css';

interface IncidentFiltersProps {
  filters: IncidentFiltersState;
  services: readonly Service[];
  serviceState: 'loading' | 'ready' | 'error';
  onChange: (patch: Partial<IncidentFiltersState>) => void;
  onClear: () => void;
}

interface IncidentSearchProps {
  appliedQuery: string;
  onChange: (query: string) => void;
}

function IncidentSearch({ appliedQuery, onChange }: IncidentSearchProps) {
  const [queryDraft, setQueryDraft] = useState(appliedQuery);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onChange(queryDraft);
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    onChange(queryDraft);
  }

  return (
    <form className={styles.search} role="search" onSubmit={handleSubmit}>
      <label htmlFor="incident-query">Search incidents</label>
      <div className={styles.searchControls}>
        <input
          id="incident-query"
          maxLength={INCIDENT_QUERY_MAX_LENGTH}
          onChange={(event) => setQueryDraft(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Title or summary"
          type="search"
          value={queryDraft}
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {appliedQuery ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQueryDraft('');
              onChange('');
            }}
          >
            Clear search
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export function IncidentFilters({
  filters,
  onChange,
  onClear,
  services,
  serviceState,
}: IncidentFiltersProps) {
  const activeCount = countActiveIncidentFilters(filters);

  return (
    <div className={styles.toolbar} aria-label="Incident list controls">
      <IncidentSearch
        appliedQuery={filters.query}
        key={filters.query}
        onChange={(query) => onChange({ query })}
      />

      <div className={styles.field}>
        <label htmlFor="incident-status">Status</label>
        <select
          id="incident-status"
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({
              status: event.target.value
                ? (event.target.value as IncidentFiltersState['status'])
                : undefined,
            })
          }
        >
          <option value="">All statuses</option>
          <option value="investigating">Investigating</option>
          <option value="identified">Identified</option>
          <option value="monitoring">Monitoring</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="incident-severity">Severity</label>
        <select
          id="incident-severity"
          value={filters.severity ?? ''}
          onChange={(event) =>
            onChange({
              severity: event.target.value
                ? (event.target.value as IncidentFiltersState['severity'])
                : undefined,
            })
          }
        >
          <option value="">All severities</option>
          <option value="sev1">SEV-1 Critical</option>
          <option value="sev2">SEV-2 Warning</option>
          <option value="sev3">SEV-3 Advisory</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="incident-service">Service</label>
        <select
          disabled={serviceState !== 'ready'}
          id="incident-service"
          value={filters.serviceId ?? ''}
          onChange={(event) =>
            onChange({ serviceId: event.target.value || undefined })
          }
        >
          <option value="">
            {serviceState === 'loading'
              ? 'Loading services…'
              : serviceState === 'error'
                ? 'Services unavailable'
                : 'All services'}
          </option>
          {serviceState !== 'ready' && filters.serviceId ? (
            <option value={filters.serviceId}>{filters.serviceId}</option>
          ) : null}
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name}
            </option>
          ))}
        </select>
        {serviceState === 'error' ? (
          <span className={styles.fieldHint}>
            Service labels are unavailable; incident records remain visible.
          </span>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="incident-sort">Sort</label>
        <select
          id="incident-sort"
          value={filters.sort}
          onChange={(event) =>
            onChange({
              sort: event.target.value as IncidentFiltersState['sort'],
            })
          }
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="severity">Severity</option>
        </select>
      </div>

      {hasActiveIncidentFilters(filters) ? (
        <div className={styles.clearArea}>
          <span>{activeCount} active</span>
          <Button type="button" variant="ghost" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  );
}
