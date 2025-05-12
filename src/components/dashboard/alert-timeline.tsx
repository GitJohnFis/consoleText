
"use client";

import type { Alert } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Info, CheckCircle, BellRing, Archive } from "lucide-react";
import { useState } from "react";

interface AlertTimelineProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onViewRelatedLogs?: (query: string) => void;
}

export function AlertTimeline({ alerts, onAcknowledge, onViewRelatedLogs }: AlertTimelineProps) {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  const getSeverityInfo = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return { icon: <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />, badge: <Badge variant="destructive">Critical</Badge> };
      case 'warning':
        return { icon: <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" />, badge: <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Warning</Badge> };
      case 'info':
      default:
        return { icon: <Info className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" />, badge: <Badge className="bg-blue-500 hover:bg-blue-600">Info</Badge> };
    }
  };

  const handleAcknowledge = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set(prev).add(alertId));
    if (onAcknowledge) {
      onAcknowledge(alertId);
    }
  };

  const sortedAlerts = [...alerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <BellRing className="h-6 w-6 text-accent mr-2" />
                <CardTitle className="text-xl font-semibold text-foreground">Monitors & Alert Timeline</CardTitle>
            </div>
        </div>
        <CardDescription>
          Active and recent alerts from your monitoring systems.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3">
          {sortedAlerts.length > 0 ? (
            <div className="space-y-4">
              {sortedAlerts.map((alert) => {
                const { icon, badge } = getSeverityInfo(alert.severity);
                const isAcknowledged = acknowledgedAlerts.has(alert.id) || alert.acknowledged;
                return (
                  <Card key={alert.id} className={`transition-opacity ${isAcknowledged ? 'opacity-60 border-green-500' : 'border-border'}`}>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center mb-1">
                          {icon}
                          <CardTitle className="text-md font-semibold leading-tight">{alert.title}</CardTitle>
                        </div>
                        {badge}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()} &bull; Source: {alert.source}
                      </p>
                    </CardHeader>
                    <CardContent className="px-4 pb-3">
                      <p className="text-sm text-muted-foreground mb-3">{alert.description}</p>
                      <div className="flex justify-end space-x-2">
                        {alert.relatedLogsQuery && onViewRelatedLogs && (
                           <Button variant="outline" size="sm" onClick={() => onViewRelatedLogs(alert.relatedLogsQuery!)}>
                             View Logs
                           </Button>
                        )}
                        {!isAcknowledged ? (
                          <Button variant="default" size="sm" onClick={() => handleAcknowledge(alert.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Acknowledge
                          </Button>
                        ) : (
                           <Button variant="ghost" size="sm" disabled className="text-green-600">
                             <Archive className="h-4 w-4 mr-1" /> Acknowledged
                           </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-muted-foreground">No active alerts.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
