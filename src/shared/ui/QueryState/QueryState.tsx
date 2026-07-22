import type { ReactNode } from 'react';

import { normalizeApiError } from '../../api/normalizeApiError';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';
import { ErrorState } from '../ErrorState/ErrorState';
import { LoadingState } from '../LoadingState/LoadingState';

interface QueryStateProps {
  children: ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  error: unknown;
  isEmpty: boolean;
  isLoading: boolean;
  loadingLabel: string;
  onRetry: () => void;
}

export function QueryState({
  children,
  emptyDescription,
  emptyTitle,
  error,
  isEmpty,
  isLoading,
  loadingLabel,
  onRetry,
}: QueryStateProps) {
  if (isLoading) return <LoadingState label={loadingLabel} />;

  if (error) {
    const normalized = normalizeApiError(error);
    return (
      <ErrorState
        title="Data unavailable"
        description={normalized.message}
        action={<Button onClick={onRetry}>Retry request</Button>}
      />
    );
  }

  if (isEmpty) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return children;
}
