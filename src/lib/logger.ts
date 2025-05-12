
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
          if (typeof data[key] === 'object' && data[key] !== null && !(data[key] instanceof Error)) {
            try {
              logAttributes[key] = JSON.stringify(data[key]);
            } catch (e) {
              logAttributes[key] = '[Unserializable Object]';
            }
          } else if (data[key] instanceof Error) {
            logAttributes[key] = data[key].stack || data[key].message;
          }
           else {
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

    const otelLogRecord: OtelLogRecord = {
      body: message,
      severityNumber,
      attributes: logAttributes,
      timestamp: timestamp, 
    };
    otelLogger.emit(otelLogRecord);

    // --- Console Logging ---
    // Format as a single string for better display in some overlays (e.g., Next.js error overlay)
    let finalConsoleMessage = `[${timestamp.toISOString()}] [${level.toUpperCase()}] ${message}`;
    if (data && Object.keys(data).length > 0) {
        try {
            // Stringify data for the console message
            // For errors, we might want to log the error's message or stack directly if present
            if (data.error instanceof Error) {
                finalConsoleMessage += ` ${data.error.stack || data.error.message}`;
                const otherData = {...data};
                delete otherData.error;
                if(Object.keys(otherData).length > 0) {
                    finalConsoleMessage += ` ${JSON.stringify(otherData)}`;
                }
            } else {
                finalConsoleMessage += ` ${JSON.stringify(data)}`;
            }
        } catch (e) {
            finalConsoleMessage += ' [Unserializable data]';
        }
    }
    
    switch (level) {
      case 'error':
        console.error(finalConsoleMessage);
        if (currentSpan) {
            currentSpan.setStatus({ code: SpanStatusCode.ERROR, message: message });
            let exceptionToRecord: Error;
            const exceptionAttributes: Attributes = {};

            if (typeof data === 'object' && data !== null) {
                Object.entries(data).forEach(([key, value]) => {
                    if (key !== 'error' && !(value instanceof Error)) { 
                        exceptionAttributes[`log.data.${key}`] = String(value);
                    }
                });
            }

            if (data && data.error instanceof Error) {
              exceptionToRecord = data.error;
            } else { 
              exceptionToRecord = new Error(message);
              // If data exists and is not an error itself, attach its stringified version to the synthetic error
              if (data && Object.keys(data).length > 0) {
                try {
                  (exceptionToRecord as any).details = JSON.stringify(data);
                } catch (e) {
                  (exceptionToRecord as any).details = "[Unserializable data]";
                }
              }
            }
            
            currentSpan.recordException(exceptionToRecord, exceptionAttributes);
        }
        break;
      case 'warn':
        console.warn(finalConsoleMessage);
         if (currentSpan) {
            const warnEventAttributes: Attributes = { 'log.level': 'warn', ...logAttributes };
            currentSpan.addEvent(`WARN: ${message}`, warnEventAttributes);
          }
        break;
      case 'info':
      case 'delivered':
        console.info(finalConsoleMessage);
        if (currentSpan) {
            const infoEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`INFO: ${message}`, infoEventAttributes);
          }
        break;
      case 'debug':
      case 'blocked':
        console.debug(finalConsoleMessage);
         if (currentSpan) {
            const debugEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(`DEBUG: ${message}`, debugEventAttributes);
          }
        break;
      default:
        console.log(finalConsoleMessage);
        if (currentSpan) {
            const defaultEventAttributes: Attributes = { 'log.level': level, ...logAttributes };
            currentSpan.addEvent(message, defaultEventAttributes);
          }
        break;
    }

    if (level === 'error' && !DATADOG_API_KEY_SET && typeof window !== 'undefined') { 
      console.log('%c[[SIMULATING ERROR FORWARDING TO DATADOG/PAGERDUTY - DATADOG_API_KEY not set]]', 'color: orange; font-weight: bold;');
    }
  },
};

// Check if DATADOG_API_KEY is set (browser-safe check)
const DATADOG_API_KEY_SET = (() => {
  try {
    // For Node.js environment
    if (typeof process !== 'undefined' && process.env) {
      return !!process.env.DATADOG_API_KEY;
    }
    // For browser environment (less common to have it directly, but for completeness)
    // This assumes it might be exposed globally or through some config object if needed client-side
    // Generally, API keys shouldn't be exposed client-side. This is more for the server-side check.
    return false; 
  } catch (e) {
    return false; // process or process.env might not be defined (e.g. strict browser)
  }
})();
