// This is a conceptual representation.
// Actual override of global console or deep integration with Datadog/PagerDuty
// would require more extensive setup and possibly backend components.

import { trace, context } from '@opentelemetry/api';

/**
 * Enhanced console logging utility.
 * In a real application, this would integrate with Datadog/PagerDuty.
 *
 * @example
 * import { logger } from '@/lib/logger';
 * logger.text('error', 'User login failed', { userId: 123, reason: 'Invalid credentials' });
 * logger.text('info', 'User successfully logged in', { userId: 123 });
 */
export const logger = {
  text: (level: 'error' | 'warn' | 'info', message: string, data?: unknown): void => {
    const timestamp = new Date().toISOString();
    const levelTag = `[${level.toUpperCase()}]`;
    
    const currentSpan = trace.getSpan(context.active());
    const spanContext = currentSpan?.spanContext();
    
    let logMessage = `[${timestamp}] ${levelTag}`;
    if (spanContext && spanContext.traceId !== '00000000000000000000000000000000') {
      logMessage += ` [traceId=${spanContext.traceId} spanId=${spanContext.spanId}]`;
    }
    logMessage += ` ${message}`;

    const logData = typeof data === 'object' && data !== null ? data : {};

    // Standard console output
    switch (level) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      case 'info':
      default:
        console.log(logMessage, logData);
        break;
    }

    // Placeholder for Datadog/PagerDuty integration
    if (level === 'error') {
      // In a real scenario, you would call your Datadog/PagerDuty SDKs here.
      // e.g., sendToDatadog({ timestamp, level, message, data, trace_id: spanContext?.traceId, span_id: spanContext?.spanId });
      // e.g., triggerPagerDutyIfNeeded({ severity: 'critical', summary: message, details: data });
      console.log('%c[[SIMULATING ERROR FORWARDING TO DATADOG/PAGERDUTY]]', 'color: orange; font-weight: bold;');
    }
  },
};

// Example to show how it might be used (will not run automatically):
// if (typeof window !== 'undefined') {
//   // Example usage in a browser context
//   logger.text('error', 'Test error from logger.ts', { details: 'This is a test error' });
// }
