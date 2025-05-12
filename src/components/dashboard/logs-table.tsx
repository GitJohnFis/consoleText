
"use client";

import type { LogEntry } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertTriangle, Info, Slash, Bug, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LogsTableProps {
  title: string;
  logs: LogEntry[];
  icon?: React.ElementType; // Made optional as title is primary
  emptyMessage?: string;
  onLogSelect: (log: LogEntry) => void;
  maxHeight?: string;
}

export function LogsTable({ title, logs, icon: Icon, emptyMessage = "No logs to display.", onLogSelect, maxHeight = "h-[400px]" }: LogsTableProps) {
  
  const getStatusBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'warn':
        return <Badge variant="secondary" className="text-xs bg-yellow-500 text-black hover:bg-yellow-600"><AlertTriangle className="h-3 w-3 mr-1" />Warn</Badge>;
      case 'info':
        return <Badge variant="secondary" className="text-xs bg-blue-500 text-white hover:bg-blue-600"><Info className="h-3 w-3 mr-1" />Info</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="text-xs bg-green-500 text-white hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'blocked':
        return <Badge variant="default" className="text-xs bg-gray-500 text-white hover:bg-gray-600"><Slash className="h-3 w-3 mr-1" />Blocked</Badge>;
      case 'debug':
        return <Badge variant="outline" className="text-xs"><Bug className="h-3 w-3 mr-1" />Debug</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{level}</Badge>;
    }
  };
  
  return (
    <Card className="shadow-lg w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
          {Icon && <Icon className="h-6 w-6 text-accent" />}
        </div>
        <CardDescription>
          Displaying latest log entries. Click a row for more details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className={maxHeight}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Level</TableHead>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Message</TableHead>
                <TableHead className="w-[150px]">Source</TableHead>
                <TableHead className="w-[80px] text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} onClick={() => onLogSelect(log)} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>{getStatusBadge(log.level)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-medium truncate max-w-xs">{log.message}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[100px]">
                      {log.source || 'N/A'}
                    </TableCell>
                     <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onLogSelect(log); }}>
                            <ExternalLink className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
