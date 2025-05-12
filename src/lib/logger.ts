import { trace, context as apiContext, SpanStatusCode, Attributes } from '@opentelemetry/api';
import { logs, SeverityNumber, LogRecord as OtelLogRecord } from '@opentelemetry/api-logs';

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
    const timestamp = new Date();
    
    const currentSpan = trace.getSpan(apiContext.active());
    const spanContext = currentSpan?.spanContext();
    
    // Prepare attributes for OTel LogRecord
    const logAttributes: Attributes = {};
    if (data) {
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (data[key] instanceof Error) {
            logAttributes[`error.message`] = data[key].message;
            logAttributes[`error.stack`] = data[key].stack;
            // also add to main attributes for simpler querying if needed
            logAttributes[key] = `Error: ${data[key].message}`;
          } else if (typeof data[key] === 'object' && data[key] !== null) {
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
    logAttributes['log.level'] = level; // Explicitly set log.level attribute

    let severityNumber: SeverityNumber;
    switch (level) {
      case 'error':
        severityNumber = SeverityNumber.ERROR;
        break;
      case 'warn':
        severityNumber = SeverityNumber.WARN;
        break;
      case 'info':
      case 'delivered':
        severityNumber = SeverityNumber.INFO;
        break;
      case 'debug':
      case 'blocked': 
        severityNumber = SeverityNumber.DEBUG;
        break;
      default:
        severityNumber = SeverityNumber.INFO; // Default to INFO for unknown levels
        break;
    }

    // Construct the full message string for console display
    let fullConsoleLogMessage = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`;
    if (data && Object.keys(data).length > 0) {
        try {
            const dataToLogForMessage = { ...data }; // Clone data to avoid mutating the original
            if (data.error instanceof Error) {
                // Append error details to the main message string
                fullConsoleLogMessage += ` Error: ${data.error.message}. Stack: ${data.error.stack}`;
                delete dataToLogForMessage.error; // Avoid redundant stringification of the error object
            }
            // Append remaining data as JSON string
            if (Object.keys(dataToLogForMessage).length > 0) {
                 fullConsoleLogMessage += ` ${JSON.stringify(dataToLogForMessage)}`;
            }
        } catch (e) {
            fullConsoleLogMessage += ' [Unserializable data in message]';
        }
    }
    
    // OTel log record uses the concise message for 'body' and structured data in 'attributes'
    const otelLogRecord: OtelLogRecord = {
      body: message, 
      severityNumber,
      attributes: logAttributes,
      timestamp: timestamp, 
    };
    otelLogger.emit(otelLogRecord);

    // --- Console Logging ---
    // Use the fully constructed string for all console outputs to ensure consistency,
    // especially for how Next.js error overlay captures and displays console messages.
    switch (level) {
      case 'error':
        console.error(fullConsoleLogMessage);
        if (currentSpan) {
            currentSpan.setStatus({ code: SpanStatusCode.ERROR, message: message }); // Set span status with concise message
            
            let exceptionToRecord: Error;
            const exceptionAttributes: Attributes = {}; // Attributes for the exception event

            // Populate exceptionAttributes from data, excluding 'error' field if it's an Error instance
            if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    if (key !== 'error' || !(value instanceof Error)) { // Add if not the error field itself, or if error field is not an Error
                        exceptionAttributes[`log.data.${key}`] = String(value);
                    }
                });
            }

            if (data && data.error instanceof Error) {
              exceptionToRecord = data.error; // Use the provided Error object
            } else { 
              // Create a new Error using the full log message for context if no specific Error object was passed
              exceptionToRecord = new Error(fullConsoleLogMessage);
            }
            currentSpan.recordException(exceptionToRecord, exceptionAttributes);
        }
        break;
      case 'warn':
        console.warn(fullConsoleLogMessage);
         if (currentSpan) {
            const warnEventAttributes: Attributes = { 'log.level': 'warn', ...logAttributes };
            currentSpan.addEvent(`WARN: ${message}`, warnEventAttributes);
          }
        break;
      case 'info':
      case 'delivered':
        console.info(fullConsoleLogMessage);
        if (currentSpan) {
            const infoEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`INFO: ${message}`, infoEventAttributes);
          }
        break;
      case 'debug':
      case 'blocked':
        console.debug(fullConsoleLogMessage);
         if (currentSpan) {
            const debugEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`DEBUG: ${message}`, debugEventAttributes);
          }
        break;
      default:
        console.log(fullConsoleLogMessage);
        if (currentSpan) {
            const defaultEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(message, defaultEventAttributes);
          }
        break;
    }

    // DATADOG_API_KEY_SET check and related log
    if (level === 'error' && !DATADOG_API_KEY_SET && typeof window !== 'undefined') { 
      console.log('%c[[SIMULATING ERROR FORWARDING TO DATADOG/PAGERDUTY - DATADOG_API_KEY not set]]', 'color: orange; font-weight: bold;');
    }
  },
};

// Check if DATADOG_API_KEY is set (browser-safe check)
const DATADOG_API_KEY_SET = (() => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return !!process.env.DATADOG_API_KEY;
    }
    return false; 
  } catch (e) {
    return false;
  }
})();
