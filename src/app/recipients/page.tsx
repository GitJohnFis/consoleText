"use client"; // Required for useState and useEffect

import { useState, useEffect } from "react";
import type { Recipient } from "@/types";
import { RecipientsTable } from "@/components/recipients/recipients-table";
import { logger } from "@/lib/logger";

// Mock data (client-side for demonstration)
const initialMockRecipients: Recipient[] = [
  {
    id: "1",
    name: "Alice Wonderland",
    phone: "+15551234567",
    email: "alice@example.com",
    alertMethods: ["sms", "call"],
    enableRetries: true,
  },
  {
    id: "2",
    name: "Bob The Builder",
    phone: "+15559876543",
    email: "bob@example.com",
    alertMethods: ["sms"],
    enableRetries: false,
  },
  {
    id: "3",
    name: "Charlie Brown",
    phone: "+15555555555",
    alertMethods: ["call"],
    enableRetries: true,
  },
];

export default function RecipientsPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);

  useEffect(() => {
    // Simulate fetching data
    setRecipients(initialMockRecipients);
    logger.info('Recipients page loaded');
  }, []);

  const handleAddRecipient = (newRecipient: Recipient) => {
    setRecipients((prevRecipients) => [...prevRecipients, newRecipient]);
  };

  const handleUpdateRecipient = (updatedRecipient: Recipient) => {
    setRecipients((prevRecipients) =>
      prevRecipients.map((r) =>
        r.id === updatedRecipient.id ? updatedRecipient : r
      )
    );
  };

  const handleDeleteRecipient = (recipientId: string) => {
    setRecipients((prevRecipients) =>
      prevRecipients.filter((r) => r.id !== recipientId)
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Recipient Management</h1>
      <p className="text-muted-foreground">
        Manage recipients for alerts (text and calls) including retry mechanisms.
      </p>
      <RecipientsTable
        recipients={recipients}
        onAddRecipient={handleAddRecipient}
        onUpdateRecipient={handleUpdateRecipient}
        onDeleteRecipient={handleDeleteRecipient}
      />
    </div>
  );
}
