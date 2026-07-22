import type { IncidentNote } from '../../../entities/incident/model/incidentNote';
import styles from '../IncidentDetailsPage.module.css';

const formatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'UTC',
});

export function IncidentNotes({ notes }: { notes: readonly IncidentNote[] }) {
  if (notes.length === 0) {
    return (
      <p className={styles.neutralState}>No response notes have been added.</p>
    );
  }
  return (
    <ol className={styles.notesList} aria-label="Incident notes">
      {notes.map((note) => {
        const pending = note.id.startsWith('temporary-note-');
        return (
          <li key={note.id}>
            <div className={styles.noteHeader}>
              <strong>{note.author}</strong>
              <span>
                {pending
                  ? 'Saving…'
                  : formatter.format(new Date(note.createdAt)) + ' UTC'}
              </span>
            </div>
            <p>{note.body}</p>
          </li>
        );
      })}
    </ol>
  );
}
