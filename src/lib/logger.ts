
import { trace, context, SpanStatusCode, Attributes } from '@opentelemetry/api';
import { logs, SeverityNumber, LogRecord as OtelLogRecord } from '@opentelemetry/api-logs'; // Renamed to avoid conflict with local types if any

// Get a logger instance from the OTel Logs API
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
  text: (
    level: 'error' | 'warn' | 'info' | 'debug' | 'delivered' | 'blocked',
    message: string,
    data?: Record<string, any>
  ): void => {
    const timestamp = new Date(); // OTel will use its own high-precision timestamp
    
    const currentSpan = trace.getSpan(context.active());
    const spanContext = currentSpan?.spanContext();
    
    // Prepare attributes for OTel LogRecord
    const logAttributes: Attributes = {};
    if (data) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          // Convert all data values to string for OTel attributes, as some backends might be strict
          // However, OTel spec allows for boolean, string, number, array of these.
          // For simplicity and Datadog compatibility, stringifying complex objects is safer.
          if (typeof data[key] === 'object' && data[key] !== null) {
            try {
              logAttributes[key] = JSON.stringify(data[key]);
            } catch (e) {
              logAttributes[key] = '[Unserializable Object]';
            }
          } else {
             logAttributes[key] = String(data[key]);
          }
        }
      }
    }

    if (spanContext && spanContext.traceId && spanContext.traceId !== '00000000000000000000000000000000') {
      logAttributes['trace_id'] = spanContext.traceId;
      logAttributes['span_id'] = spanContext.spanId;
    }
    logAttributes['log.level'] = level; // Add the custom level as an attribute

    let severityNumber: SeverityNumber;
    // Map custom levels to OTel SeverityNumber
    switch (level) {
      case 'error':
        severityNumber = SeverityNumber.ERROR;
        break;
      case 'warn':
        severityNumber = SeverityNumber.WARN;
        break;
      case 'info':
      case 'delivered': // Treat 'delivered' as INFO
        severityNumber = SeverityNumber.INFO;
        break;
      case 'debug':
      case 'blocked': // Treat 'blocked' as DEBUG or custom level
        severityNumber = SeverityNumber.DEBUG;
        break;
      default:
        severityNumber = SeverityNumber.INFO; // Default to INFO
        break;
    }

    // Emit the log record using OTel Logs API
    const otelLogRecord: OtelLogRecord = {
      body: message,
      severityNumber,
      attributes: logAttributes,
      timestamp: timestamp, 
    };
    otelLogger.emit(otelLogRecord);

    // Console logging with structured data if provided
    const consoleLogParts: any[] = [`[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`];
    if (data && Object.keys(data).length > 0) {
        // For browser console, logging the object directly often gives better inspection tools
        consoleLogParts.push(data);
    }
    
    switch (level) {
      case 'error':
        console.error(...consoleLogParts);
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
            } else { 
              exceptionToRecord = new Error(message);
            }
            
            currentSpan.recordException(exceptionToRecord, exceptionAttributes);
        }
        break;
      case 'warn':
        console.warn(...consoleLogParts);
         if (currentSpan) {
            const warnEventAttributes: Attributes = { 'log.level': 'warn', ...logAttributes };
            currentSpan.addEvent(`WARN: ${message}`, warnEventAttributes);
          }
        break;
      case 'info':
      case 'delivered':
        console.info(...consoleLogParts);
        if (currentSpan) {
            const infoEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`INFO: ${message}`, infoEventAttributes);
          }
        break;
      case 'debug':
      case 'blocked':
        console.debug(...consoleLogParts); // Or console.log for wider visibility
         if (currentSpan) {
            const debugEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`DEBUG: ${message}`, debugEventAttributes);
          }
        break;
      default:
        console.log(...consoleLogParts);
        if (currentSpan) {
            const defaultEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(message, defaultEventAttributes);
          }
        break;
    }

    if (level === 'error' && !process.env.DATADOG_API_KEY && typeof window !== 'undefined') { 
      console.log('%c[[SIMULATING ERROR FORWARDING TO DATADOG/PAGERDUTY - DATADOG_API_KEY not set]]', 'color: orange; font-weight: bold;');
    }
  },
};
