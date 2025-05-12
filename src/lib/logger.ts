
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
    logAttributes['log.level'] = level;

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
        severityNumber = SeverityNumber.INFO;
        break;
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
    // Use a multi-argument approach for console logging.
    const consolePrefix = `[${timestamp.toISOString()}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        if (data) {
            console.error(consolePrefix, message, data);
        } else {
            console.error(consolePrefix, message);
        }
        if (currentSpan) {
            currentSpan.setStatus({ code: SpanStatusCode.ERROR, message: message });
            
            let exceptionToRecord: Error;
            const exceptionAttributes: Attributes = {};

            if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    if (key !== 'error' || !(value instanceof Error)) {
                        try {
                            exceptionAttributes[`log.data.${key}`] = typeof value === 'string' ? value : JSON.stringify(value);
                        } catch {
                            exceptionAttributes[`log.data.${key}`] = '[Unserializable value in exception attributes]';
                        }
                    }
                });
            }

            if (data && data.error instanceof Error) {
              exceptionToRecord = data.error;
            } else {
              // Create a new Error object for recordException
              let errorMsgForException = `${consolePrefix} ${message}`;
              if (data) {
                try {
                    const dataWithoutErrorField = { ...data };
                    if (data.error) delete dataWithoutErrorField.error; // Avoid duplicating error if it was just a string
                    if (Object.keys(dataWithoutErrorField).length > 0) {
                       errorMsgForException += ` ${JSON.stringify(dataWithoutErrorField)}`;
                    }
                } catch {
                    errorMsgForException += ` [Unserializable data for exception message]`;
                }
              }
              exceptionToRecord = new Error(errorMsgForException);
            }
            currentSpan.recordException(exceptionToRecord, exceptionAttributes);
        }
        break;
      case 'warn':
        if (data) {
            console.warn(consolePrefix, message, data);
        } else {
            console.warn(consolePrefix, message);
        }
        if (currentSpan) {
            const warnEventAttributes: Attributes = { 'log.level': 'warn', ...logAttributes };
            currentSpan.addEvent(`WARN: ${message}`, warnEventAttributes);
        }
        break;
      case 'info':
      case 'delivered':
        if (data) {
            console.info(consolePrefix, message, data);
        } else {
            console.info(consolePrefix, message);
        }
        if (currentSpan) {
            const infoEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`INFO: ${message}`, infoEventAttributes);
        }
        break;
      case 'debug':
      case 'blocked':
        if (data) {
            console.debug(consolePrefix, message, data);
        } else {
            console.debug(consolePrefix, message);
        }
        if (currentSpan) {
            const debugEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`DEBUG: ${message}`, debugEventAttributes);
        }
        break;
      default:
        if (data) {
            console.log(consolePrefix, message, data);
        } else {
            console.log(consolePrefix, message);
        }
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
    // Checking for process and process.env to ensure it's Node-like environment
    if (typeof process !== 'undefined' && process.env) {
      // Using Next.js specific way to access public env vars if available, otherwise fallback
      return !!(process.env.NEXT_PUBLIC_DATADOG_API_KEY || process.env.DATADOG_API_KEY);
    }
    // For browser environments, you might need a different mechanism if keys are exposed there,
    // e.g., through NEXT_PUBLIC_ variables.
    // Assuming for now that if not in Node-like env, key is not set for this check.
    return false; 
  } catch (e) {
    // Catch errors if process or process.env is not accessible (e.g. strict browser sandboxes)
    return false;
  }
})();
