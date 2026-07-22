import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { normalizeRepositoryUrl } from '../../shared/config/siteConfig';
import { LandingPage } from './LandingPage';

function renderLanding(repositoryUrl?: string) {
  render(
    <MemoryRouter>
      <LandingPage repositoryUrl={repositoryUrl} />
    </MemoryRouter>,
  );
}

describe('LandingPage', () => {
  it('presents Detect, Investigate, and Resolve in workflow order', () => {
    renderLanding();

    const steps = screen
      .getAllByRole('listitem')
      .map((item) => item.textContent);
    expect(steps).toHaveLength(3);
    expect(steps[0]).toMatch(/Detect/);
    expect(steps[1]).toMatch(/Investigate/);
    expect(steps[2]).toMatch(/Resolve/);
  });

  it('describes concrete engineering decisions', () => {
    renderLanding();

    expect(screen.getByText('Typed boundaries')).toBeInTheDocument();
    expect(screen.getByText('Purposeful state')).toBeInTheDocument();
    expect(screen.getByText('Deterministic demo')).toBeInTheDocument();
    expect(screen.getByText('Accessible by default')).toBeInTheDocument();
  });

  it('starts the implemented simulation from both primary calls to action', () => {
    renderLanding();

    const demoLinks = screen.getAllByRole('link', {
      name: 'Start simulation',
    });
    expect(demoLinks).toHaveLength(2);
    demoLinks.forEach((link) =>
      expect(link).toHaveAttribute('href', '/app/overview?demo=start'),
    );
  });

  it('omits repository links when no real URL is configured', () => {
    renderLanding();

    expect(
      screen.queryByRole('link', { name: /source repository/i }),
    ).not.toBeInTheDocument();
  });

  it('renders safe external repository links when a URL is configured', () => {
    renderLanding('https://github.com/example/pulseops');

    const sourceLinks = screen.getAllByRole('link', {
      name: 'View PulseOps source repository (opens in a new tab)',
    });
    expect(sourceLinks).toHaveLength(2);
    sourceLinks.forEach((link) => {
      expect(link).toHaveAttribute(
        'href',
        'https://github.com/example/pulseops',
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    });
  });
});

describe('normalizeRepositoryUrl', () => {
  it('normalizes supported URLs and rejects unsafe or invalid values', () => {
    expect(
      normalizeRepositoryUrl(' https://github.com/example/pulseops/ '),
    ).toBe('https://github.com/example/pulseops');
    expect(normalizeRepositoryUrl('javascript:alert(1)')).toBeUndefined();
    expect(normalizeRepositoryUrl('not a URL')).toBeUndefined();
    expect(normalizeRepositoryUrl('')).toBeUndefined();
  });
});
