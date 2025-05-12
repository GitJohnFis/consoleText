
"use client"; 

import { useEffect, useState } from 'react';
import type { ErrorCountStat, LogEntry, Alert } from "@/types";
import { StatsCard } from "@/components/dashboard/stats-card";
import { LogsTable } from "@/components/dashboard/logs-table";
import { LogDetailModal } from "@/components/dashboard/log-detail-modal";
import { AlertTimeline } from "@/components/dashboard/alert-timeline";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { AlertTriangle, CheckCircle2, Slash, Info, BarChart3, ListChecks } from "lucide-react";
import { logger } from '@/lib/logger';
import { metrics as apiMetrics, trace, context as apiContext, SpanStatusCode } from '@opentelemetry/api';

const generateMockLogs = (count: number): LogEntry[] => {
  const levels: LogEntry['level'][] = ['error', 'warn', 'info', 'delivered', 'blocked', 'debug'];
  const messages: Record<LogEntry['level'], string[]> = {
    error: ["Critical system failure in payment module", "User authentication failed: Invalid token", "Database connection timeout"],
    warn: ["High CPU usage detected on server-02", "Low disk space warning", "API rate limit approaching"],
    info: ["User JohnDoe logged in successfully", "New order #12345 placed", "System maintenance scheduled for 2 AM UTC"],
    delivered: ["Notification successfully sent to +1XXXXXXX", "Email receipt dispatched to user@example.com"],
    blocked: ["Request blocked due to rate limit from IP 192.168.1.100", "Unauthorized access attempt to /admin"],
    debug: ["Processing item ID: xyz-789", "Cache hit for key: user_profile_johndoe", "Function X execution time: 25ms"],
  };
  const sources = ["AuthService", "PaymentGateway", "OrderProcessor", "NotificationService", "WebAppFirewall", "APIServer"];

  return Array.from({ length: count }, (_, i) => {
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    const randomMessageTemplate = messages[randomLevel][Math.floor(Math.random() * messages[randomLevel].length)];
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    
    return {
      id: `${randomLevel}-${i}-${Date.now()}`,
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 3), // Within last 3 days
      message: randomMessageTemplate.includes("XXXXXXX") 
               ? randomMessageTemplate.replace("XXXXXXX", Math.floor(1000000 + Math.random() * 9000000).toString())
               : randomMessageTemplate,
      source: randomSource,
      level: randomLevel,
      details: { 
        ipAddress: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        ...(randomLevel === 'error' && { stackTrace: "Error: Something went wrong\n  at foo (bar.js:12:34)\n  at baz (qux.js:56:78)"}),
        payloadSize: Math.floor(Math.random() * 1024) + "KB"
      }
    };
  }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const generateMockAlerts = (count: number): Alert[] => {
  const severities: Alert['severity'][] = ['critical', 'warning', 'info'];
  const titles = {
    critical: ["Critical: High Error Rate in Payment API", "Critical: Database Unresponsive", "Critical: Security Breach Detected"],
    warning: ["Warning: Latency Spike in Order Service", "Warning: Disk Usage > 90% on primary-db", "Warning: Unusual Login Activity"],
    info: ["Info: Successful Deployment of v1.2.0", "Info: Scheduled Maintenance Completed", "Info: New User Registration Peak"]
  };
  const descriptions = {
    critical: "Immediate attention required. System stability is at risk.",
    warning: "Monitor closely. Performance may be degrading.",
    info: "For your information. No action typically required."
  };
  const sources = ["Payment API Monitor", "Database Health Check", "Security IDS", "Order Service Monitor", "System Metrics", "Deployment Pipeline"];

  return Array.from({ length: count }, (_, i) => {
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)];
    return {
      id: `alert-${i}-${Date.now()}`,
      timestamp: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 12), // Within last 12 hours
      severity: randomSeverity,
      title: titles[randomSeverity][Math.floor(Math.random() * titles[randomSeverity].length)],
      description: descriptions[randomSeverity],
      source: sources[Math.floor(Math.random() * sources.length)],
      acknowledged: Math.random() > 0.7,
      relatedLogsQuery: randomSeverity === 'critical' ? 'error payment' : (randomSeverity === 'warning' ? 'warn order' : undefined)
    };
  }).sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};


const initialErrorStats: ErrorCountStat[] = [
  { id: "total-errors", title: "Total Errors (24h)", value: "0", icon: AlertTriangle, description: "Across all services" },
  { id: "critical-alerts", title: "Critical Alerts", value: "0", icon: AlertTriangle, description: "Requiring attention" },
  { id: "sms-failures", title: "SMS Failures", value: "0", icon: Slash, description: "Delivery system" },
  { id: "api-errors", title: "API Errors", value: "0", icon: BarChart3, description: "/v1/process endpoint" },
];

const meter = apiMetrics.getMeter('console-text-app-frontend');
const dashboardPageViews = meter.createCounter('dashboard.page_views.total', {
  description: 'Counts the number of times the dashboard page is viewed',
});
const simulatedErrorCounter = meter.createCounter('dashboard.simulated_errors.total', {
  description: 'Counts simulated errors for alerting demonstration',
});

const SIMULATED_ERROR_THRESHOLD = 5;
const tracer = trace.getTracer('console-text-app-frontend-tracer');

export default function DashboardPage() {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [errorStats, setErrorStats] = useState<ErrorCountStat[]>(initialErrorStats);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [activeLevels, setActiveLevels] = useState<LogEntry['level'][]>(['error', 'warn', 'info', 'delivered', 'blocked', 'debug']);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [simulatedErrorCount, setSimulatedErrorCount] = useState(0);


  useEffect(() => {
    const span = tracer.startSpan('DashboardPage.loadData');
    apiContext.with(trace.setSpan(apiContext.active(), span), () => {
      try {
        const mockLogs = generateMockLogs(50);
        setAllLogs(mockLogs);
        setAlerts(generateMockAlerts(5));
        
        const errors24h = mockLogs.filter(log => log.level === 'error' && (Date.now() - log.timestamp.getTime()) < 24*60*60*1000).length;
        const criticalAlertsCount = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length; // Using newly generated alerts for count

        setErrorStats([
          { id: "total-errors", title: "Total Errors (24h)", value: errors24h.toString(), icon: AlertTriangle, description: "+2 from yesterday", changeType: "negative" },
          { id: "critical-alerts", title: "Active Critical Alerts", value: criticalAlertsCount.toString(), icon: ListChecks, description: "Requiring attention", changeType: criticalAlertsCount > 0 ? "negative" : "positive"},
          { id: "sms-failures", title: "SMS Failures (Simulated)", value: "3", icon: Slash, description: "No change", changeType: "positive" },
          { id: "api-errors", title: "API Errors (Simulated)", value: "8", icon: BarChart3, description: "+3 from yesterday", changeType: "negative" },
        ]);
        
        dashboardPageViews.add(1, { 'page.name': 'dashboard' });
        logger.text('info', 'Dashboard page view metric recorded', { page: 'dashboard'});

        logger.text('info', 'Dashboard loaded', { userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A', logCount: mockLogs.length });
        
        const shouldSimulateError = Math.random() < 0.3; 
        if (shouldSimulateError) {
          logger.text('error', 'Simulated critical dashboard error on load', { component: 'DashboardPage', errorCode: 'DASH_CRIT_001' });
          simulatedErrorCounter.add(1);
          setSimulatedErrorCount(prev => {
            const newCount = prev + 1;
            if (newCount >= SIMULATED_ERROR_THRESHOLD) {
              logger.text('warn', `[[SIMULATED ALERT]]: Simulated error count (${newCount}) has reached threshold of ${SIMULATED_ERROR_THRESHOLD}`, { threshold: SIMULATED_ERROR_THRESHOLD });
            }
            return newCount;
          });
        }
        span.setStatus({ code: SpanStatusCode.OK });
      } catch (error) {
        logger.text('error', 'Error in DashboardPage.useEffect', { error: (error as Error).message, stack: (error as Error).stack });
        span.setStatus({ code: SpanStatusCode.ERROR, message: (error as Error).message });
        span.recordException(error as Error);
      } finally {
        span.end();
      }
    });

  }, []); // Removed alerts from dependency array to prevent re-fetch on acknowledge

  const filteredLogs = allLogs.filter(log => {
    const searchTermMatch = searchTerm.toLowerCase() === '' || 
                            log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (log.source && log.source.toLowerCase().includes(searchTerm.toLowerCase()));
    const levelMatch = activeLevels.includes(log.level);
    return searchTermMatch && levelMatch;
  });

  const handleLogSelect = (log: LogEntry) => {
    setSelectedLog(log);
  };

  const handleCloseModal = () => {
    setSelectedLog(null);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prevAlerts => prevAlerts.map(a => a.id === alertId ? {...a, acknowledged: true } : a));
    logger.text('info', `Alert acknowledged: ${alertId}`, { alertId });
    // Update critical alerts count (optional, as stats might update on next load)
     const criticalAlertsCount = alerts.filter(a => a.id !== alertId && a.severity === 'critical' && !a.acknowledged).length;
     setErrorStats(prevStats => prevStats.map(s => s.id === "critical-alerts" ? {...s, value: criticalAlertsCount.toString(), changeType: criticalAlertsCount > 0 ? "negative" : "positive"} : s));
  };

  const handleViewRelatedLogs = (query: string) => {
    setSearchTerm(query);
    // Optionally, could also set activeLevels here if query implies a level
    logger.text('info', `Filtering logs based on alert query: ${query}`);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <section>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Key Metrics</h2>
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
         <p className="text-xs text-muted-foreground mt-2">Simulated errors for demo: {simulatedErrorCount} (threshold: {SIMULATED_ERROR_THRESHOLD})</p>
      </section>

      <section>
        <AlertTimeline alerts={alerts} onAcknowledge={handleAcknowledgeAlert} onViewRelatedLogs={handleViewRelatedLogs} />
      </section>
      
      <section className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Log Explorer</h2>
          <DashboardFilters 
            searchTerm={searchTerm}
            onSearchTermChange={setSearchTerm}
            activeLevels={activeLevels}
            onActiveLevelsChange={setActiveLevels}
          />
        </div>
        <LogsTable 
            title="All Logs" 
            logs={filteredLogs} 
            onLogSelect={handleLogSelect}
            emptyMessage={allLogs.length === 0 ? "No logs found." : "No logs match your current filters."}
        />
      </section>

      <LogDetailModal isOpen={!!selectedLog} log={selectedLog} onClose={handleCloseModal} />
    </div>
  );
}
