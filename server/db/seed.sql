PRAGMA foreign_keys = ON;

DELETE FROM service_dependencies;
DELETE FROM metric_snapshots;
DELETE FROM incident_notes;
DELETE FROM incident_events;
DELETE FROM incidents;
DELETE FROM services;

INSERT INTO services
  (id, name, slug, description, status, slo_target, uptime_30d, last_deploy_at)
VALUES
  ('service-payments', 'Payments API', 'payments-api', 'Payment authorization and settlement orchestration.', 'operational', 99.95, 99.98, '2026-07-18T14:20:00.000Z'),
  ('service-checkout', 'Checkout Web', 'checkout-web', 'Customer checkout experience and order submission.', 'operational', 99.9, 99.96, '2026-07-17T09:15:00.000Z'),
  ('service-identity', 'Identity', 'identity', 'Session, token and customer identity services.', 'operational', 99.95, 99.99, '2026-07-16T16:40:00.000Z'),
  ('service-notifications', 'Notifications', 'notifications', 'Transactional message delivery and status callbacks.', 'operational', 99.5, 99.88, '2026-07-15T11:05:00.000Z');

INSERT INTO service_dependencies
  (service_id, dependency_service_id, sort_order)
VALUES
  ('service-checkout', 'service-payments', 0),
  ('service-checkout', 'service-identity', 1),
  ('service-payments', 'service-identity', 0),
  ('service-notifications', 'service-identity', 0);

INSERT INTO incidents
  (id, service_id, title, summary, severity, status, owner, started_at, resolved_at, created_at, updated_at)
VALUES
  ('incident-payments-latency', 'service-payments', 'Elevated payment authorization latency', 'A provider timeout increased authorization latency in one region.', 'sev2', 'resolved', 'Maya Chen', '2026-07-12T08:30:00.000Z', '2026-07-12T09:18:00.000Z', '2026-07-12T08:34:00.000Z', '2026-07-12T09:18:00.000Z'),
  ('incident-checkout-errors', 'service-checkout', 'Checkout submission errors', 'A frontend deployment caused intermittent order submission failures.', 'sev1', 'monitoring', 'Noah Williams', '2026-07-18T18:05:00.000Z', NULL, '2026-07-18T18:07:00.000Z', '2026-07-18T18:42:00.000Z'),
  ('incident-identity-tokens', 'service-identity', 'Token refresh degradation', 'Refresh requests exceeded the latency objective during cache warming.', 'sev3', 'identified', 'Priya Shah', '2026-07-17T12:10:00.000Z', NULL, '2026-07-17T12:16:00.000Z', '2026-07-17T12:35:00.000Z'),
  ('incident-notification-delay', 'service-notifications', 'Delayed transactional notifications', 'Queue depth delayed delivery confirmations for a subset of messages.', 'sev3', 'investigating', NULL, '2026-07-19T06:20:00.000Z', NULL, '2026-07-19T06:25:00.000Z', '2026-07-19T06:25:00.000Z'),
  ('incident-checkout-assets', 'service-checkout', 'Checkout asset cache misses', 'A CDN configuration increased static asset response time.', 'sev2', 'resolved', 'Elena Rossi', '2026-07-08T15:00:00.000Z', '2026-07-08T15:31:00.000Z', '2026-07-08T15:03:00.000Z', '2026-07-08T15:31:00.000Z'),
  ('incident-identity-login', 'service-identity', 'Login rate limit saturation', 'Unexpected retry traffic saturated a shared login rate limit.', 'sev1', 'resolved', 'Priya Shah', '2026-07-03T20:40:00.000Z', '2026-07-03T21:22:00.000Z', '2026-07-03T20:42:00.000Z', '2026-07-03T21:22:00.000Z');

INSERT INTO incident_events
  (id, incident_id, type, message, created_at)
VALUES
  ('event-notification-alert', 'incident-notification-delay', 'metric_alert', 'Delivery delay exceeded the warning threshold.', '2026-07-19T06:20:00.000Z'),
  ('event-notification-created', 'incident-notification-delay', 'created', 'Incident created from queue delay alert.', '2026-07-19T06:25:00.000Z'),
  ('event-checkout-created', 'incident-checkout-errors', 'created', 'Incident created after checkout error-rate alert.', '2026-07-18T18:07:00.000Z'),
  ('event-checkout-status', 'incident-checkout-errors', 'status_changed', 'Status changed to monitoring after rollback.', '2026-07-18T18:42:00.000Z'),
  ('event-payments-created', 'incident-payments-latency', 'created', 'Incident created after regional latency alert.', '2026-07-12T08:34:00.000Z'),
  ('event-payments-resolved', 'incident-payments-latency', 'status_changed', 'Status changed to resolved.', '2026-07-12T09:18:00.000Z');

INSERT INTO incident_notes
  (id, incident_id, author, body, created_at)
VALUES
  ('note-payments-1', 'incident-payments-latency', 'Maya Chen', 'Traffic was shifted away from the affected provider region.', '2026-07-12T08:51:00.000Z'),
  ('note-checkout-1', 'incident-checkout-errors', 'Noah Williams', 'Rollback completed; error rate is returning to baseline.', '2026-07-18T18:38:00.000Z');

INSERT INTO metric_snapshots
  (id, service_id, timestamp, latency_ms, error_rate, throughput)
VALUES
  ('metric-0000', 'service-payments', '2026-07-19T00:00:00.000Z', 136, 0.14, 1268),
  ('metric-0030', 'service-payments', '2026-07-19T00:30:00.000Z', 139, 0.15, 1284),
  ('metric-0100', 'service-payments', '2026-07-19T01:00:00.000Z', 141, 0.17, 1292),
  ('metric-0130', 'service-payments', '2026-07-19T01:30:00.000Z', 137, 0.14, 1301),
  ('metric-0200', 'service-payments', '2026-07-19T02:00:00.000Z', 143, 0.18, 1279),
  ('metric-0230', 'service-payments', '2026-07-19T02:30:00.000Z', 140, 0.16, 1310),
  ('metric-0300', 'service-payments', '2026-07-19T03:00:00.000Z', 144, 0.19, 1296),
  ('metric-0330', 'service-payments', '2026-07-19T03:30:00.000Z', 138, 0.15, 1320),
  ('metric-0400', 'service-payments', '2026-07-19T04:00:00.000Z', 146, 0.2, 1288),
  ('metric-0430', 'service-payments', '2026-07-19T04:30:00.000Z', 141, 0.17, 1325),
  ('metric-0500', 'service-payments', '2026-07-19T05:00:00.000Z', 142, 0.18, 1280),
  ('metric-0530', 'service-payments', '2026-07-19T05:30:00.000Z', 138, 0.16, 1315),
  ('metric-0600', 'service-payments', '2026-07-19T06:00:00.000Z', 147, 0.21, 1304);
