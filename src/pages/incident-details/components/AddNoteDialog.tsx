import { useEffect, useId, useRef, useState, type FormEvent } from 'react';

import {
  addIncidentNoteRequestSchema,
  type AddIncidentNoteRequest,
} from '../../../entities/incident/model/incidentNote';
import { INCIDENT_OWNERS } from '../../../entities/incident/model/incidentWorkflow';
import { Button } from '../../../shared/ui/Button/Button';
import styles from '../IncidentDetailsPage.module.css';

interface AddNoteDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (note: AddIncidentNoteRequest) => Promise<boolean>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  pending: boolean;
  error: string | null;
}

export function AddNoteDialog({
  error,
  onClose,
  onSubmit,
  open,
  pending,
  triggerRef,
}: AddNoteDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const authorId = useId();
  const bodyId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [author, setAuthor] = useState<string>(INCIDENT_OWNERS[0]);
  const [body, setBody] = useState('');
  const [validation, setValidation] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
      }
      requestAnimationFrame(() =>
        dialog.querySelector<HTMLSelectElement>('select')?.focus(),
      );
    } else if (dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  const close = () => {
    if (pending) return;
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = addIncidentNoteRequestSchema.safeParse({ author, body });
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? 'Enter a valid note.');
      return;
    }
    setValidation(null);
    const saved = await onSubmit(parsed.data);
    if (saved) {
      setBody('');
      onClose();
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          close();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <form method="dialog" onSubmit={(event) => void submit(event)}>
        <div className={styles.dialogHeader}>
          <p className={styles.eyebrow}>Response log</p>
          <h2 id={titleId}>Add incident note</h2>
          <p id={descriptionId}>
            Record concise operational context for this incident.
          </p>
        </div>
        <label htmlFor={authorId}>Author</label>
        <select
          id={authorId}
          value={author}
          onChange={(event) => setAuthor(event.target.value)}
          disabled={pending}
        >
          {INCIDENT_OWNERS.map((owner) => (
            <option key={owner}>{owner}</option>
          ))}
        </select>
        <div className={styles.textareaLabel}>
          <label htmlFor={bodyId}>Note</label>
          <span>{body.length}/1000</span>
        </div>
        <textarea
          id={bodyId}
          value={body}
          maxLength={1000}
          rows={7}
          disabled={pending}
          aria-describedby={validation || error ? errorId : undefined}
          aria-invalid={Boolean(validation || error)}
          onChange={(event) => {
            setBody(event.target.value);
            setValidation(null);
          }}
        />
        {validation || error ? (
          <p className={styles.formError} id={errorId} role="alert">
            {validation ?? error}
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <Button
            type="button"
            variant="ghost"
            onClick={close}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving note…' : 'Add note'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
