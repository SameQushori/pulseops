import { RotateCcw, ShieldAlert } from 'lucide-react';

import { useAppDispatch, useAppSelector } from '../../../app/store/hooks';
import type { MetricPoint } from '../../../entities/metric/model/metricPoint';
import { Button } from '../../../shared/ui/Button/Button';
import {
  selectCanBeginRecovery,
  selectCanResetSimulation,
  selectCanStartSimulation,
  selectSimulation,
} from '../model/simulationSelectors';
import { buildSimulationScenario } from '../model/simulationScenario';
import {
  beginRecovery,
  resetSimulation,
  startSimulation,
} from '../model/simulationSlice';
import { SimulationStatus } from './SimulationStatus';
import styles from './Simulation.module.css';

const nextActionCopy = {
  idle: 'Start the deterministic Payments API degradation scenario.',
  degrading: 'Telemetry is moving through a fixed degradation sequence.',
  'incident-created': 'PulseOps is opening the simulated incident workflow.',
  investigating: 'Review the impact, then begin the recovery sequence.',
  recovering: 'Fixed recovery points are returning telemetry to baseline.',
  resolved: 'The service recovered. Reset to replay the identical scenario.',
} as const;

interface SimulationControlsProps {
  baselinePoint: MetricPoint;
}

export function SimulationControls({ baselinePoint }: SimulationControlsProps) {
  const dispatch = useAppDispatch();
  const simulation = useAppSelector(selectSimulation);
  const canStart = useAppSelector(selectCanStartSimulation);
  const canRecover = useAppSelector(selectCanBeginRecovery);
  const canReset = useAppSelector(selectCanResetSimulation);

  const handleRecovery = () => {
    const scenario = buildSimulationScenario(baselinePoint);
    dispatch(beginRecovery(scenario.monitoringEvent));
  };

  return (
    <section className={styles.panel} aria-labelledby="simulation-title">
      <div className={styles.copy}>
        <p className={styles.eyebrow}>Incident simulation</p>
        <div className={styles.titleRow}>
          <ShieldAlert aria-hidden="true" size={20} />
          <h2 id="simulation-title">Payments API scenario</h2>
        </div>
        <p>{nextActionCopy[simulation.phase]}</p>
      </div>

      <SimulationStatus phase={simulation.phase} />

      <div className={styles.actions}>
        {canStart ? (
          <Button onClick={() => dispatch(startSimulation({ baselinePoint }))}>
            Start simulation
          </Button>
        ) : null}
        {canRecover ? (
          <Button onClick={handleRecovery}>Begin recovery</Button>
        ) : null}
        {canReset ? (
          <Button
            onClick={() => dispatch(resetSimulation())}
            variant="secondary"
          >
            <RotateCcw aria-hidden="true" size={16} />
            Reset demo
          </Button>
        ) : null}
      </div>

      <p className={styles.feedback} role="status" aria-live="polite">
        {simulation.feedbackMessage}
      </p>
    </section>
  );
}
