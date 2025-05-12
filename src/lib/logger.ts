
import { trace, context, SpanStatusCode, Attributes } from '@opentelemetry/api';
import { logs, SeverityNumber, LogRecord } from '@opentelemetry/api-logs';

// Get a logger instance from the OTel Logs API
// The name and version should match your service's general identification.
// These might be overridden or augmented by the LoggerProvider's resource attributes.
const otelLogger = logs.getLogger(
  process.env.OTEL_SERVICE_NAME || 'console-text-app',
  process.env.OTEL_SERVICE_VERSION || '0.1.0'
);

/**
 * Enhanced console logging utility that also sends logs via OpenTelemetry.
 *
 * @example
 * import { logger } from '@/lib/logger';
 * logger.text('error', 'User login failed', { userId: 123, reason: 'Invalid credentials' });
 * logger.text('info', 'User successfully logged in', { userId: 123 });
 */
export const logger = {
  text: (level: 'error' | 'warn' | 'info', message: string, data?: Record<string, any>): void => {
    const timestamp = new Date(); // OTel will use its own high-precision timestamp
    
    const currentSpan = trace.getSpan(context.active());
    const spanContext = currentSpan?.spanContext();
    
    // Prepare attributes for OTel LogRecord
    const logAttributes: Attributes = {};
    if (data) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // OTel attributes can be string, number, boolean, or arrays of these.
          // For simplicity, converting all to string here, but could be more type-aware.
          logAttributes[key] = String(data[key]);
        }
      }
    }

    if (spanContext && spanContext.traceId && spanContext.traceId !== '00000000000000000000000000000000') {
      logAttributes['trace_id'] = spanContext.traceId;
      logAttributes['span_id'] = spanContext.spanId;
    }

    let severityNumber: SeverityNumber;
    switch (level) {
      case 'error':
        severityNumber = SeverityNumber.ERROR;
        break;
      case 'warn':
        severityNumber = SeverityNumber.WARN;
        break;
      case 'info':
      default:
        severityNumber = SeverityNumber.INFO;
        break;
    }

    // Emit the log record using OTel Logs API
    const logRecord: LogRecord = {
      body: message,
      severityNumber,
      attributes: logAttributes,
      timestamp: timestamp, // Explicitly set timestamp for consistency if needed, OTel will set one too.
    };
    otelLogger.emit(logRecord);

    // --- Original console logging and span interaction (can be kept for local visibility or specific needs) ---
    const levelTag = `[${level.toUpperCase()}]`;
    let consoleLogMessage = `[${timestamp.toISOString()}] ${levelTag}`;
    if (spanContext && spanContext.traceId && spanContext.traceId !== '00000000000000000000000000000000') {
      consoleLogMessage += ` [traceId=${spanContext.traceId} spanId=${spanContext.spanId}]`;
    }
    consoleLogMessage += ` ${message}`;
    const consoleLogDataString = data && Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
    const fullConsoleLogMessage = `${consoleLogMessage}${consoleLogDataString}`;


    // Standard console output (optional, as OTel might also be configured to output to console)
    switch (level) {
      case 'error':
        console.error(fullConsoleLogMessage);
        if (currentSpan) {
            currentSpan.setStatus({ code: SpanStatusCode.ERROR, message: message });
            let exceptionToRecord: Error;
            const exceptionAttributes: Attributes = {};

            if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    if (key !== 'error') { 
                        exceptionAttributes[`log.data.${key}`] = String(value);
                    }
                });
            }

            if (data && data.error instanceof Error) {
              exceptionToRecord = data.error;
            } else if (typeof data === 'string' && data.length > 0) {
              exceptionToRecord = new Error(data); 
              if (message !== data) { 
                exceptionAttributes['original.message'] = message;
              }
            } else {
              exceptionToRecord = new Error(message); 
            }
            
            currentSpan.recordException(exceptionToRecord, exceptionAttributes);
        }
        break;
      case 'warn':
        console.warn(fullConsoleLogMessage);
        if (currentSpan) {
            const eventAttributes: Attributes = {};
            if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    eventAttributes[`log.data.${key}`] = String(value);
                });
            } else if (data !== undefined) {
                eventAttributes['log.data'] = String(data);
            }
            currentSpan.addEvent(`WARN: ${message}`, eventAttributes);
        }
        break;
      case 'info':
      default:
        console.log(fullConsoleLogMessage);
         if (currentSpan) {
            const eventAttributes: Attributes = {};
            if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    eventAttributes[`log.data.${key}`] = String(value);
                });
            } else if (data !== undefined) {
                eventAttributes['log.data'] = String(data);
            }
            currentSpan.addEvent(`INFO: ${message}`, eventAttributes);
        }
        break;
    }

    // Placeholder for direct PagerDuty integration (usually Datadog handles this)
    if (level === 'error' && !process.env.DATADOG_API_KEY) { // Only log this if Datadog isn't configured
      console.log('%c[[SIMULATING ERROR FORWARDING TO DATADOG/PAGERDUTY - DATADOG_API_KEY not set]]', 'color: orange; font-weight: bold;');
    }
  },
};
