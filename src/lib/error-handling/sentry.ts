import * as Sentry from "@sentry/nextjs";

export function initSentry(): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1
  });
}

export default Sentry;
