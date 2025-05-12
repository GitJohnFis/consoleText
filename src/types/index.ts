export interface Recipient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  alertMethods: ('sms' | 'call')[];
  enableRetries: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  source?: string; // e.g. recipient name for delivered, or system part for blocked
  level: 'error' | 'warn' | 'info' | 'debug' | 'delivered' | 'blocked';
  details?: Record<string, any> | string; // Allow structured details or simple string
}

export interface ErrorCountStat {
  id: string;
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  changeType?: 'positive' | 'negative';
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  source: string; // e.g., "API Errors Monitor", "SMS Delivery System"
  acknowledged?: boolean;
  relatedLogsQuery?: string; // Optional: a query string to filter logs
}
