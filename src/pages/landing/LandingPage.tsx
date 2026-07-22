import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '../../shared/ui/Button/Button';
import { siteConfig } from '../../shared/config/siteConfig';
import { SystemPreview } from './components/SystemPreview';
import styles from './LandingPage.module.css';

const workflowSteps = [
  {
    title: 'Detect',
    description:
      'Latency and error rate move beyond their expected baseline, making the affected service visible.',
  },
  {
    title: 'Investigate',
    description:
      'Inspect the service context and follow a typed, chronological incident timeline.',
  },
  {
    title: 'Resolve',
    description:
      'Assign an owner, document the response, and restore the service to an operational state.',
  },
] as const;

const engineeringDecisions = [
  {
    title: 'Typed boundaries',
    description:
      'Zod validates API responses before server data reaches the interface.',
  },
  {
    title: 'Purposeful state',
    description:
      'RTK Query owns server state; Redux slices are reserved for cross-screen workflows.',
  },
  {
    title: 'Deterministic demo',
    description:
      'A repeatable scenario keeps behavior, tests, and visual states stable.',
  },
  {
    title: 'Accessible by default',
    description:
      'Keyboard navigation, reduced motion, and responsive layouts are built into the experience.',
  },
] as const;

interface LandingPageProps {
  repositoryUrl?: string;
}

export function LandingPage({
  repositoryUrl = siteConfig.repositoryUrl,
}: LandingPageProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">
        Skip to main content
      </a>

      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link className={styles.brand} to="/" aria-label="PulseOps home">
            <span className={styles.brandMark} aria-hidden="true" />
            PulseOps
          </Link>

          <nav className={styles.navigation} aria-label="Landing page">
            <a href="#how-it-works">How it works</a>
            <a href="#engineering">Engineering</a>
          </nav>

          <Button asChild className={styles.headerAction}>
            <Link to="/app/overview">Open demo</Link>
          </Button>
        </div>
      </header>

      <main id="main-content" tabIndex={-1}>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              Interactive incident-response simulator
            </p>
            <h1 id="hero-title" className={styles.heroTitle}>
              See an incident unfold.
              <span>Resolve it before users notice.</span>
            </h1>
            <p className={styles.heroDescription}>
              PulseOps lets you trigger a simulated service failure, investigate
              validated telemetry, coordinate the response, and restore the
              system.
            </p>

            <div className={styles.heroActions}>
              <Button asChild>
                <Link to="/app/overview?demo=start">Start simulation</Link>
              </Button>
              {repositoryUrl ? (
                <Button asChild variant="secondary">
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="View PulseOps source repository (opens in a new tab)"
                  >
                    View source
                    <ArrowUpRight aria-hidden="true" size={16} />
                  </a>
                </Button>
              ) : null}
            </div>

            <p className={styles.trustLine}>
              No account required <span aria-hidden="true">·</span>{' '}
              Deterministic demo <span aria-hidden="true">·</span> About 3
              minutes
            </p>
          </div>

          <SystemPreview />
        </section>

        <section
          className={styles.workflowSection}
          id="how-it-works"
          aria-labelledby="workflow-title"
        >
          <div className={styles.sectionIntro}>
            <p className={styles.sectionIndex}>01 / How it works</p>
            <h2 id="workflow-title">One incident, followed end to end.</h2>
            <p>
              The demo keeps the operational story focused: identify a signal,
              understand the impact, then coordinate a documented recovery.
            </p>
          </div>

          <ol className={styles.workflowList}>
            {workflowSteps.map((step, index) => (
              <li key={step.title}>
                <span className={styles.stepNumber} aria-hidden="true">
                  0{index + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className={styles.honestySection} aria-labelledby="demo-title">
          <p className={styles.sectionIndex}>
            Built as an honest demonstration
          </p>
          <div>
            <h2 id="demo-title">
              Simulated signals. Real interface contracts.
            </h2>
            <p>
              PulseOps uses deterministic simulated telemetry. It is a portfolio
              project designed to demonstrate production-style frontend
              architecture and incident-management workflows.
            </p>
            <p>
              Incident actions follow one typed API contract. MSW provides the
              isolated demo transport, while Cloudflare Pages Functions, Hono,
              and local D1 implement the same boundary without page rewrites.
            </p>
          </div>
        </section>

        <section
          className={styles.engineeringSection}
          id="engineering"
          aria-labelledby="engineering-title"
        >
          <div className={styles.sectionIntro}>
            <p className={styles.sectionIndex}>02 / Engineering</p>
            <h2 id="engineering-title">Decisions you can inspect.</h2>
            <p>
              The project is shaped around predictable data flow, explicit
              boundaries, and an interface that remains usable across input
              methods and screen sizes.
            </p>
          </div>

          <dl className={styles.decisionList}>
            {engineeringDecisions.map((decision) => (
              <div key={decision.title}>
                <dt>{decision.title}</dt>
                <dd>{decision.description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-title">
          <div>
            <p className={styles.eyebrow}>The console is ready</p>
            <h2 id="final-cta-title">
              Follow the response from signal to resolution.
            </h2>
            <p>
              Explore the system, trigger an incident, and follow it through
              resolution.
            </p>
          </div>
          <Button asChild>
            <Link to="/app/overview?demo=start">Start simulation</Link>
          </Button>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>PulseOps</p>
        <p>React + TypeScript</p>
        <p>© {currentYear}</p>
        {repositoryUrl ? (
          <a
            href={repositoryUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="View PulseOps source repository (opens in a new tab)"
          >
            Source <ArrowUpRight aria-hidden="true" size={14} />
          </a>
        ) : null}
      </footer>
    </div>
  );
}
