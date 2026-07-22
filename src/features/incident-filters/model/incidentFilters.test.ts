import {
  INCIDENT_QUERY_MAX_LENGTH,
  defaultIncidentFilters,
  parseIncidentFilters,
  serializeIncidentFilters,
  updateIncidentFilters,
} from './incidentFilters';

describe('incident URL filters', () => {
  it('uses canonical defaults for empty params', () => {
    expect(parseIncidentFilters(new URLSearchParams())).toEqual(
      defaultIncidentFilters,
    );
    expect(serializeIncidentFilters(defaultIncidentFilters).toString()).toBe(
      '',
    );
  });

  it.each([
    ['status', 'investigating'],
    ['status', 'identified'],
    ['status', 'monitoring'],
    ['status', 'resolved'],
    ['severity', 'sev1'],
    ['severity', 'sev2'],
    ['severity', 'sev3'],
    ['sort', 'newest'],
    ['sort', 'oldest'],
    ['sort', 'severity'],
  ])('parses valid %s=%s', (key, value) => {
    const filters = parseIncidentFilters(new URLSearchParams([[key, value]]));
    expect(filters[key as keyof typeof filters]).toBe(value);
  });

  it('trims, truncates and removes invalid values without throwing', () => {
    const query = `  ${'x'.repeat(INCIDENT_QUERY_MAX_LENGTH + 20)}  `;
    const filters = parseIncidentFilters(
      new URLSearchParams({
        query,
        status: 'closed',
        severity: 'urgent',
        serviceId: '   ',
        sort: 'popular',
      }),
    );

    expect(filters).toEqual({
      query: 'x'.repeat(INCIDENT_QUERY_MAX_LENGTH),
      sort: 'newest',
    });
  });

  it('uses the first repeated value predictably', () => {
    const params = new URLSearchParams(
      'status=monitoring&status=resolved&severity=sev2&severity=sev1',
    );
    expect(parseIncidentFilters(params)).toMatchObject({
      status: 'monitoring',
      severity: 'sev2',
    });
  });

  it('serializes in a stable order and omits default sort', () => {
    const filters = parseIncidentFilters(
      new URLSearchParams(
        'sort=oldest&serviceId=service-payments&severity=sev2&status=resolved&query=latency',
      ),
    );

    expect(serializeIncidentFilters(filters).toString()).toBe(
      'query=latency&status=resolved&severity=sev2&serviceId=service-payments&sort=oldest',
    );
  });

  it('updates one filter while preserving the others', () => {
    const filters = parseIncidentFilters(
      new URLSearchParams('query=checkout&severity=sev1&sort=oldest'),
    );

    expect(updateIncidentFilters(filters, { status: 'monitoring' })).toEqual({
      query: 'checkout',
      severity: 'sev1',
      status: 'monitoring',
      sort: 'oldest',
    });
  });

  it('clears to the canonical empty URL', () => {
    expect(serializeIncidentFilters(defaultIncidentFilters).toString()).toBe(
      '',
    );
  });
});
