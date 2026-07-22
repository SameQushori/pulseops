import { render, screen } from '@testing-library/react';

import { Button } from './Button/Button';
import { ErrorState } from './ErrorState/ErrorState';
import { SeverityBadge } from './SeverityBadge/SeverityBadge';

describe('shared UI primitives', () => {
  it('renders Button with native button semantics and a safe default type', () => {
    render(<Button>Retry</Button>);
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute(
      'type',
      'button',
    );
  });

  it('renders severity as visible text rather than color alone', () => {
    render(<SeverityBadge severity="sev1" />);
    expect(screen.getByText('SEV-1 Critical')).toBeInTheDocument();
  });

  it('announces an error and renders an optional action', () => {
    render(
      <ErrorState
        title="Could not load"
        description="Try again."
        action={<Button>Retry</Button>}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load');
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
