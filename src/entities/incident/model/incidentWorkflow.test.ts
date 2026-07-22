import { getAllowedIncidentStatuses } from './incidentWorkflow';

describe('incident workflow transitions', () => {
  it('returns only allowed next statuses', () => {
    expect(getAllowedIncidentStatuses('investigating')).toEqual([
      'identified',
      'monitoring',
    ]);
    expect(getAllowedIncidentStatuses('identified')).toEqual(['monitoring']);
    expect(getAllowedIncidentStatuses('monitoring')).toEqual(['resolved']);
    expect(getAllowedIncidentStatuses('resolved')).toEqual([]);
  });
});
