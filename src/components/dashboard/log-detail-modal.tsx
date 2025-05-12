
"use client";

import type { LogEntry } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, CheckCircle2, Info, Slash, Bug } from "lucide-react";

interface LogDetailModalProps {
  log: LogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogDetailModal({ log, isOpen, onClose }: LogDetailModalProps) {
  if (!log) return null;

  const getLevelInfo = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return { icon: <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />, badge: <Badge variant="destructive">Error</Badge> };
      case 'warn':
        return { icon: <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />, badge: <Badge className="bg-yellow-500 hover:bg-yellow-600 text-black">Warning</Badge> };
      case 'info':
        return { icon: <Info className="h-5 w-5 text-blue-500 mr-2" />, badge: <Badge className="bg-blue-500 hover:bg-blue-600">Info</Badge> };
      case 'delivered':
        return { icon: <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />, badge: <Badge className="bg-green-500 hover:bg-green-600">Delivered</Badge> };
      case 'blocked':
        return { icon: <Slash className="h-5 w-5 text-gray-500 mr-2" />, badge: <Badge className="bg-gray-500 hover:bg-gray-600">Blocked</Badge> };
      case 'debug':
        return { icon: <Bug className="h-5 w-5 text-purple-500 mr-2" />, badge: <Badge className="bg-purple-500 hover:bg-purple-600">Debug</Badge> };
      default:
        return { icon: null, badge: <Badge variant="outline">{level}</Badge> };
    }
  };

  const { icon, badge } = getLevelInfo(log.level);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {icon} Log Details {badge}
          </DialogTitle>
          <DialogDescription>
            Detailed information for log ID: {log.id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Timestamp</h3>
            <p className="text-sm text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Message</h3>
            <p className="text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap">{log.message}</p>
          </div>
          {log.source && (
            <div>
              <h3 className="font-semibold text-foreground mb-1">Source</h3>
              <p className="text-sm text-muted-foreground">{log.source}</p>
            </div>
          )}
          {log.details && (
            <div>
              <h3 className="font-semibold text-foreground mb-1">Details</h3>
              <pre className="text-sm text-muted-foreground bg-muted p-3 rounded-md overflow-x-auto">
                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
