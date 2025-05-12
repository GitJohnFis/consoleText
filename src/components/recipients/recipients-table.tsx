"use client";

import type { Recipient } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit, Phone, MessageSquare, PlusCircle } from "lucide-react";
import { RecipientFormDialog } from "./recipient-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { ScrollArea } from "../ui/scroll-area";

interface RecipientsTableProps {
  recipients: Recipient[];
  onAddRecipient: (recipient: Recipient) => void;
  onUpdateRecipient: (recipient: Recipient) => void;
  onDeleteRecipient: (recipientId: string) => void;
}

export function RecipientsTable({
  recipients,
  onAddRecipient,
  onUpdateRecipient,
  onDeleteRecipient,
}: RecipientsTableProps) {
  const { toast } = useToast();

  const handleDelete = (recipient: Recipient) => {
    onDeleteRecipient(recipient.id);
    toast({
      title: "Recipient Deleted",
      description: `${recipient.name} has been successfully deleted.`,
      variant: "destructive"
    });
    logger.warn(`Recipient deleted`, { name: recipient.name, id: recipient.id });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RecipientFormDialog onSave={onAddRecipient} />
      </div>
      <ScrollArea className="rounded-md border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Alert Methods</TableHead>
              <TableHead className="text-center">Retries</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipients.length > 0 ? (
              recipients.map((recipient) => (
                <TableRow key={recipient.id}>
                  <TableCell className="font-medium">{recipient.name}</TableCell>
                  <TableCell>{recipient.phone}</TableCell>
                  <TableCell>{recipient.email || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {recipient.alertMethods.map((method) => (
                        <Badge key={method} variant="secondary" className="capitalize">
                          {method === 'sms' && <MessageSquare className="h-3 w-3 mr-1" />}
                          {method === 'call' && <Phone className="h-3 w-3 mr-1" />}
                          {method}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Checkbox checked={recipient.enableRetries} disabled aria-readonly />
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <RecipientFormDialog
                      recipient={recipient}
                      onSave={onUpdateRecipient}
                      triggerButton={
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the recipient "{recipient.name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(recipient)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No recipients found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
