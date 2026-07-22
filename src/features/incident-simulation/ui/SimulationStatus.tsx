import type { SimulationPhase } from '../model/simulationSlice';
import styles from './Simulation.module.css';

const phaseLabels: Record<SimulationPhase, string> = {
  idle: 'Stable baseline',
  degrading: 'Telemetry degrading',
  'incident-created': 'SEV-2 incident created',
  investigating: 'Incident investigating',
  recovering: 'Service recovering',
  resolved: 'Incident resolved',
};

const phaseOrder: SimulationPhase[] = [
  'idle',
  'degrading',
  'incident-created',
  'investigating',
  'recovering',
  'resolved',
];

interface SimulationStatusProps {
  phase: SimulationPhase;
}

export function SimulationStatus({ phase }: SimulationStatusProps) {
  const currentIndex = phaseOrder.indexOf(phase);
  return (
    <div className={styles.statusBlock}>
      <strong>{phaseLabels[phase]}</strong>
      <ol className={styles.progressList} aria-label="Simulation progress">
        {phaseOrder.slice(1).map((step, index) => (
          <li
            data-current={step === phase || undefined}
            data-complete={currentIndex > index + 1 || undefined}
            key={step}
          >
            {phaseLabels[step]}
          </li>
        ))}
      </ol>
    </div>
  );
}
