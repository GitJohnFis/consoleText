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
  type: 'delivered' | 'blocked';
  details?: string;
}

export interface ErrorCountStat {
  id: string;
  title: string;
  value: string;
  icon: React.ElementType;
  change?: string; // e.g., "+5.2% from last month"
  changeType?: 'positive' | 'negative';
}
