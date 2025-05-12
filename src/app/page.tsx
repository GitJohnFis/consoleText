
"use client"; // Required for mock data and stateful components

import { useEffect, useState } from 'react';
import type { ErrorCountStat, LogEntry } from "@/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { LogsTable } from "@/components/dashboard/logs-table";
import { AlertTriangle, CheckCircle2, Slash, TrendingUp, TrendingDown } from "lucide-react";
import { logger } from '@/lib/logger'; // Example of using the logger

// Mock data generation (client-side for demonstration)
const generateMockLogs = (count: number, type: 'delivered' | 'blocked'): LogEntry[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `${type}-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 7), // Within last 7 days
    message: type === 'delivered' ? `Notification successfully sent to +1XXXXXXX${Math.floor(1000 + Math.random() * 9000)}` : `Request blocked due to rate limit`,
    source: type === 'delivered' ? `User #${Math.floor(100 + Math.random() * 900)}` : `API Endpoint /v1/send`,
    type: type,
    details: type === 'blocked' ? `IP: 192.168.1.${Math.floor(1 + Math.random() * 254)}` : undefined,
  })).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const initialErrorStats: ErrorCountStat[] = [
  { id: "total-errors", title: "Total Errors (24h)", value: "0", icon: AlertTriangle, description: "Across all services" },
  { id: "sms-failures", title: "SMS Failures", value: "0", icon: Slash, description: "Delivery system" },
  { id: "call-failures", title: "Call Failures", value: "0", icon: Slash, description: "Telephony provider" },
  { id: "api-errors", title: "API Errors", value: "0", icon: AlertTriangle, description: "/v1/process endpoint" },
];

export default function DashboardPage() {
  const [deliveredLogs, setDeliveredLogs] = useState<LogEntry[]>([]);
  const [blockedLogs, setBlockedLogs] = useState<LogEntry[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorCountStat[]>(initialErrorStats);

  useEffect(() => {
    // Simulate fetching data
    setDeliveredLogs(generateMockLogs(8, 'delivered'));
    setBlockedLogs(generateMockLogs(3, 'blocked'));
    setErrorStats([
      { id: "total-errors", title: "Total Errors (24h)", value: "12", icon: AlertTriangle, description: "+2 from yesterday", changeType: "negative" },
      { id: "sms-failures", title: "SMS Failures", value: "3", icon: Slash, description: "No change", changeType: "positive" },
      { id: "call-failures", title: "Call Failures", value: "1", icon: Slash, description: "-1 from yesterday", changeType: "positive" },
      { id: "api-errors", title: "API Errors", value: "8", icon: AlertTriangle, description: "+3 from yesterday", changeType: "negative" },
    ]);
    
    // Example of using the logger on page load
    logger.text('info', 'Dashboard loaded', { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A' });
    // logger.text('error', 'Simulated critical dashboard error on load', { component: 'DashboardPage' });

  }, []);

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {errorStats.map((stat) => (
            <StatsCard
              key={stat.id}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              description={stat.description}
              className={stat.changeType === 'negative' ? 'border-l-4 border-destructive' : stat.changeType === 'positive' ? 'border-l-4 border-green-500' : ''}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <LogsTable title="Delivered Notifications" logs={deliveredLogs} icon={CheckCircle2} emptyMessage="No notifications delivered recently." />
        <LogsTable title="Blocked Requests" logs={blockedLogs} icon={Slash} emptyMessage="No requests blocked recently."/>
      </section>
    </div>
  );
}

