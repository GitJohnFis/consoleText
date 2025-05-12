
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
  const { BatchLogRecordProcessor, LoggerProvider, SimpleLogRecordProcessor, ConsoleLogRecordExporter } = require('@opentelemetry/sdk-logs');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const { Resource } = require('@opentelemetry/resources');
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
  const { DiagConsoleLogger, DiagLogLevel, diag } = require('@opentelemetry/api');
  const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-node'); // For console traces
  const { ConsoleMetricExporter } = require('@opentelemetry/sdk-metrics'); // For console metrics

  // For troubleshooting, set OpenTelemetry diagnostic level to DEBUG
  // diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

  const DATADOG_API_KEY = process.env.DATADOG_API_KEY;
  const DATADOG_SITE = process.env.DATADOG_SITE || 'datadoghq.com'; // e.g., datadoghq.com, datadoghq.eu
  const OTEL_SERVICE_NAME = process.env.OTEL_SERVICE_NAME || 'console-text-app';
  const OTEL_SERVICE_VERSION = process.env.OTEL_SERVICE_VERSION || '0.1.0';

  if (!DATADOG_API_KEY) {
    console.warn(
      'DATADOG_API_KEY is not set. OpenTelemetry data will not be sent to Datadog. Falling back to console exporters.'
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
    : new ConsoleSpanExporter(); 

  const metricExporter = DATADOG_API_KEY
    ? new OTLPMetricExporter({
        url: `https://otel.http.${DATADOG_SITE}/v1/metrics`,
        ...otlpExporterOptions,
      })
    : new ConsoleMetricExporter();

  const logExporter = DATADOG_API_KEY
    ? new OTLPLogExporter({
        url: `https://otel.http.${DATADOG_SITE}/v1/logs`,
        ...otlpExporterOptions,
      })
    : undefined; // ConsoleLogRecordExporter will be added separately
    
  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: OTEL_SERVICE_NAME,
    [SemanticResourceAttributes.SERVICE_VERSION]: OTEL_SERVICE_VERSION,
  });

  const sdkConfig = {
    resource: resource,
    traceExporter: traceExporter, // Always have a trace exporter (Datadog or Console)
    metricReader: new PeriodicExportingMetricReader({ // Always have a metric reader
      exporter: metricExporter, 
      exportIntervalMillis: 10000, 
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Example to disable specific instrumentations:
        // '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  };
  
  const loggerProvider = new LoggerProvider({ resource });

  // Add Datadog log exporter if API key is present
  if (logExporter) {
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(logExporter)
    );
  }
  // Always add ConsoleLogRecordExporter for local development visibility
  loggerProvider.addLogRecordProcessor(
    new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
  );
  
  // Attach the LoggerProvider to the OpenTelemetry API
  const { logs } = require('@opentelemetry/api-logs');
  logs.setGlobalLoggerProvider(loggerProvider);


  const sdk = new NodeSDK(sdkConfig);

  try {
    sdk.start();
    console.log(`OpenTelemetry SDK started for ${OTEL_SERVICE_NAME} v${OTEL_SERVICE_VERSION}.`);
    if (DATADOG_API_KEY) {
      console.log(`Sending telemetry to Datadog site: ${DATADOG_SITE}`);
    } else {
      console.log('Sending telemetry to console.');
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
}

export async function register() {
  // This function is called by Next.js instrumentation hook.
  // It can be used for further registration if needed.
  console.log('Instrumentation hook registered.');
}
