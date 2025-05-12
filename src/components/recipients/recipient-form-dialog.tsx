"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { Recipient } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";
import { PlusCircle, Edit } from "lucide-react";
import { useState } from "react";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const recipientFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  phone: z.string().regex(phoneRegex, { message: "Invalid phone number." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  alertMethods: z.array(z.enum(["sms", "call"])).min(1, { message: "Select at least one alert method." }),
  enableRetries: z.boolean().default(false),
});

type RecipientFormData = z.infer<typeof recipientFormSchema>;

interface RecipientFormDialogProps {
  recipient?: Recipient;
  onSave: (data: Recipient) => void;
  triggerButton?: React.ReactNode;
}

export function RecipientFormDialog({ recipient, onSave, triggerButton }: RecipientFormDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<RecipientFormData>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: {
      name: recipient?.name || "",
      phone: recipient?.phone || "",
      email: recipient?.email || "",
      alertMethods: recipient?.alertMethods || [],
      enableRetries: recipient?.enableRetries || false,
    },
  });

  function onSubmit(data: RecipientFormData) {
    const newRecipientData: Recipient = {
      id: recipient?.id || crypto.randomUUID(),
      ...data,
      email: data.email || undefined, // ensure email is undefined if empty string
    };
    onSave(newRecipientData);
    toast({
      title: recipient ? "Recipient Updated" : "Recipient Added",
      description: `${data.name} has been successfully ${recipient ? 'updated' : 'added'}.`,
    });
    logger.info(`Recipient ${recipient ? 'updated' : 'added'}`, { name: data.name });
    setIsOpen(false);
    form.reset();
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset(recipient ? {
        name: recipient.name,
        phone: recipient.phone,
        email: recipient.email || "",
        alertMethods: recipient.alertMethods,
        enableRetries: recipient.enableRetries,
      } : {
        name: "",
        phone: "",
        email: "",
        alertMethods: [],
        enableRetries: false,
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : (
            recipient ? (
                <Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" /> Edit</Button>
            ) : (
                <Button><PlusCircle className="h-4 w-4 mr-2" /> Add Recipient</Button>
            )
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{recipient ? "Edit Recipient" : "Add New Recipient"}</DialogTitle>
          <DialogDescription>
            {recipient ? "Update the details of this recipient." : "Fill in the details for the new recipient."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="alertMethods"
              render={() => (
                <FormItem>
                  <FormLabel>Alert Methods</FormLabel>
                  <div className="flex items-center space-x-4">
                    {(["sms", "call"] as const).map((method) => (
                      <FormField
                        key={method}
                        control={form.control}
                        name="alertMethods"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(method)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...(field.value || []), method])
                                    : field.onChange(
                                        (field.value || []).filter(
                                          (value) => value !== method
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {method}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="enableRetries"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Enable Retries for Calls</FormLabel>
                    <p className="text-xs text-muted-foreground">If a call is not answered, attempt to call again.</p>
                  </div>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">Save Recipient</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
