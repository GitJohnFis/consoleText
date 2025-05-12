
/**
 * @fileOverview OpenTelemetry instrumentation setup for the Next.js application.
 * This file is automatically run by Next.js (if experimental.instrumentationHook is true)
 * to initialize tracing, metrics, and logs collection and export to Datadog.
 */

// This check ensures this code only runs on the server-side.
if (process.env.NEXT_RUNTIME === 'nodejs') {
  require('dotenv').config(); // Load environment variables from .env file

  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');
  const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
  const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
  const { BatchLogRecordProcessor, LoggerProvider } = require('@opentelemetry/sdk-logs');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const { Resource } = require('@opentelemetry/resources');
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
  const { DiagConsoleLogger, DiagLogLevel, diag } = require('@opentelemetry/api');

  // For troubleshooting, set OpenTelemetry diagnostic level to DEBUG
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

  const DATADOG_API_KEY = process.env.DATADOG_API_KEY;
  const DATADOG_SITE = process.env.DATADOG_SITE || 'datadoghq.com'; // e.g., datadoghq.com, datadoghq.eu
  const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'console-text-app';
  const OTEL_SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION || '0.1.0';

  if (!DATADOG_API_KEY) {
    console.warn(
      'DATADOG_API_KEY is not set. OpenTelemetry data will not be sent to Datadog.'
    );
  }

  const otlpExporterOptions = {
    headers: {
      'DD-API-KEY': DATADOG_API_KEY,
    },
  };

  const traceExporter = DATADOG_API_KEY
    ? new OTLPTraceExporter({
        url: `https://otel.http.${DATADOG_SITE}/v1/traces`,
        ...otlpExporterOptions,
      })
    : undefined; // Fallback to console if API key is missing, or remove this line to disable traces

  const metricExporter = DATADOG_API_KEY
    ? new OTLPMetricExporter({
        url: `https://otel.http.${DATADOG_SITE}/v1/metrics`,
        ...otlpExporterOptions,
      })
    : undefined;

  const logExporter = DATADOG_API_KEY
    ? new OTLPLogExporter({
        url: `https://otel.http.${DATADOG_SITE}/v1/logs`,
        ...otlpExporterOptions,
      })
    : undefined;
    
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: OTEL_SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: OTEL_SERVICE_VERSION,
    // Add other resource attributes like deployment.environment if needed
  });

  const sdkConfig = {
    resource: resource,
    instrumentations: [
      getNodeAutoInstrumentations({
        // Example to disable specific instrumentations:
        // '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  };

  if (traceExporter) {
    sdkConfig.traceExporter = traceExporter;
  } else {
    console.log('OTLP Trace Exporter for Datadog is not configured (DATADOG_API_KEY missing). Traces will not be sent.');
    // Optionally, add ConsoleSpanExporter for local debugging if Datadog isn't configured
    // const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
    // sdkConfig.traceExporter = new ConsoleSpanExporter();
  }

  if (metricExporter) {
    sdkConfig.metricReader = new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 10000, // Export metrics every 10 seconds
    });
  } else {
    console.log('OTLP Metric Exporter for Datadog is not configured (DATADOG_API_KEY missing). Metrics will not be sent.');
    // Optionally, add ConsoleMetricExporter for local debugging
    // const { ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics');
    // sdkConfig.metricReader = new PeriodicExportingMetricReader({ exporter: new ConsoleMetricExporter(), exportIntervalMillis: 10000 });
  }
  
  const loggerProvider = new LoggerProvider({ resource });

  if (logExporter) {
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(logExporter)
    );
     // Attach the LoggerProvider to the OpenTelemetry API
    const { logs } = require('@opentelemetry/api-logs');
    logs.setGlobalLoggerProvider(loggerProvider);
  } else {
     console.log('OTLP Log Exporter for Datadog is not configured (DATADOG_API_KEY missing). Logs will not be sent via OTLP.');
    // Optionally, add console log processor for local debugging
    // const { SimpleLogRecordProcessor, ConsoleLogRecordExporter } = require('@opentelemetry/sdk-logs');
    // loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new ConsoleLogRecordExporter()));
  }


  const sdk = new NodeSDK(sdkConfig);

  try {
    sdk.start();
    console.log(`OpenTelemetry SDK started for ${OTEL_SERVICE_NAME} v${OTEL_SERVICE_VERSION}.`);
    if (DATADOG_API_KEY) {
      console.log(`Attempting to send data to Datadog site: ${DATADOG_SITE}`);
    }
  } catch (error) {
    console.error('Error starting OpenTelemetry SDK:', error);
  }

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('OpenTelemetry SDK shut down successfully.'))
      .catch((error) => console.error('Error shutting down OpenTelemetry SDK:', error))
      .finally(() => process.exit(0));
  });

  /*
  ==================================================================================
  MANUAL DATADOG & PAGERDUTY SETUP GUIDE:
  ==================================================================================

  After deploying your application with the above OpenTelemetry setup, you need to
  configure Datadog and PagerDuty manually:

  1. Verify Data in Datadog:
     - Ensure your `DATADOG_API_KEY` and `DATADOG_SITE` environment variables are correctly set.
     - After your application runs and generates telemetry (logs, traces, metrics),
       check your Datadog account:
       - Logs: Navigate to Logs -> Search.
       - Traces: Navigate to APM -> Traces.
       - Metrics: Navigate to Metrics -> Explorer.
     - You should see data tagged with `service:console-text-app` (or your OTEL_SERVICE_NAME).

  2. Set Up a Monitor in Datadog (for alerting):
     - In the Datadog UI, go to "Monitors" -> "New Monitor".
     - Choose "Log Alert" for alerts based on logs.
     - Define the search query. Example for error logs from your service:
       `status:error service:console-text-app`
       (Adjust `console-text-app` if you changed `OTEL_SERVICE_NAME`).
     - Set the alert conditions (e.g., trigger if the count is above 5 in the last 5 minutes).
     - Configure notifications. This is where you'll link to PagerDuty.

  3. Integrate Datadog with PagerDuty:
     - In Datadog: Go to "Integrations" -> Search for "PagerDuty".
     - Click "Install" or "Configure" if already installed.
     - Add a new PagerDuty service configuration:
       - Name: Give your PagerDuty service a name (e.g., "ConsoleApp-Prod-Alerts").
       - Service Integration Key: Get this key from PagerDuty.
         - In PagerDuty: Go to "Services" -> "Service Directory".
         - If you have an existing service, select it. Otherwise, click "New Service".
         - Name your service and assign an escalation policy.
         - Under "Integrations", click "Add an integration".
         - Search for "Datadog" and add it. An integration key will be generated. Copy this key.
       - Paste the PagerDuty integration key into the Datadog configuration.
     - Save the Datadog PagerDuty integration.

  4. Link Datadog Monitor to PagerDuty:
     - Go back to the Datadog Monitor you created (or are creating).
     - In the "Notify your team" section (or similar, UI might vary):
       - Add a notification recipient using "@pagerduty-<your_pagerduty_service_name_in_datadog>".
       - Example: If you named your PagerDuty service "ConsoleApp-Prod-Alerts" in Datadog's PagerDuty integration setup, you'd use `@pagerduty-ConsoleApp-Prod-Alerts`.
     - Save the monitor.

  Now, when your Datadog monitor's conditions are met (e.g., an error spike), Datadog will
  trigger an incident in the configured PagerDuty service, which will then follow
  your PagerDuty escalation policies (e.g., send SMS, calls).
  ==================================================================================
  */
}

export async function register() {
  // This function is called by Next.js instrumentation hook.
  // It can be used for further registration if needed.
  console.log('Instrumentation hook registered.');
}
