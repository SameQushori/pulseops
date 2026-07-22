import { render, screen } from '@testing-library/react';

import { BorderGlow } from './BorderGlow';

describe('BorderGlow', () => {
  it('preserves child semantics and exposes the selected variant', () => {
    const { container } = render(
      <BorderGlow variant="warning">
        <a href="/app/incidents">Open incidents</a>
      </BorderGlow>,
    );

    expect(
      screen.getByRole('link', { name: 'Open incidents' }),
    ).toHaveAttribute('href', '/app/incidents');
    expect(container.firstElementChild).toHaveAttribute(
      'data-border-glow-variant',
      'warning',
    );
  });

  it('marks every effect layer as decorative', () => {
    const { container } = render(<BorderGlow>Content</BorderGlow>);
    const decorativeLayers = container.querySelectorAll('[aria-hidden="true"]');

    expect(decorativeLayers).toHaveLength(2);
    decorativeLayers.forEach((layer) =>
      expect(layer).toHaveAttribute('aria-hidden', 'true'),
    );
  });
});
