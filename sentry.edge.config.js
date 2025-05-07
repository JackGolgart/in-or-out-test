import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://6843c68dcc385d6c4d8a76386fb40b49@o4509283962781696.ingest.us.sentry.io/4509283962978304',
  tracesSampleRate: 1.0,
  telemetry: false, // optional: disables anonymous usage telemetry to Sentry
});