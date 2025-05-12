
/**
 * @fileOverview OpenTelemetry instrumentation setup for the Next.js application.
 * This file is automatically run by Next.js (if experimental.instrumentationHook is true)
 * to initialize tracing and metrics collection.
 */

// This check ensures this code only runs on the server-side.
if (process.env.NEXT_RUNTIME === 'nodejs') {
  const { NodeSDK } = require('@opentelemetry/sdk-node');
  // For traces:
  const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node');
  // For metrics:
  const { ConsoleMetricExporter, PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const { Resource } = require('@opentelemetry/resources');
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
  // const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  // const { OTLPMetricExporter } = require('@opentelemetry/exporter-metrics-otlp-http');

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'console-text-app',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '0.1.0',
    }),
    // Example for OTLP Trace Exporter (e.g., for Datadog)
    // traceExporter: new OTLPTraceExporter({
    //   url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    //   headers: {
    //     // 'DD-API-KEY': process.env.DATADOG_API_KEY, // Example for Datadog
    //   },
    // }),
    traceExporter: new ConsoleSpanExporter(), // Default to console exporter for traces

    // Example for OTLP Metric Exporter (e.g., for Datadog)
    // metricReader: new PeriodicExportingMetricReader({
    //   exporter: new OTLPMetricExporter({
    //     url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
    //     headers: {
    //       // 'DD-API-KEY': process.env.DATADOG_API_KEY, // Example for Datadog
    //     },
    //   }),
    //   exportIntervalMillis: 10000,
    // }),
    metricReader: new PeriodicExportingMetricReader({ // Default to console exporter for metrics
      exporter: new ConsoleMetricExporter(),
      exportIntervalMillis: 10000, // Export metrics every 10 seconds
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Example to disable specific instrumentations:
        // '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  try {
    sdk.start();
    console.log('OpenTelemetry SDK started for console.text app.');
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
}

export async function register() {
  // This function is called by Next.js instrumentation hook.
  // It can be used for further registration if needed.
  console.log('Instrumentation hook registered.');
}
