import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface EmailTemplate {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  category: "GENERAL" | "FOLLOW_UP" | "REMINDER" | "CONFIRMATION" | "REACTIVATION";
  subject: string;
  body: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  description?: string;
  category?: EmailTemplate["category"];
  subject: string;
  body: string;
  isDefault?: boolean;
}

export interface UpdateEmailTemplateInput extends Partial<CreateEmailTemplateInput> {
  id: string;
}

async function fetchEmailTemplates(category?: string): Promise<EmailTemplate[]> {
  const params = new URLSearchParams();
  if (category) params.set("category", category);

  const res = await fetch(`/api/v1/email-templates?${params}`);
  if (!res.ok) throw new Error("Failed to fetch email templates");
  return res.json();
}

async function fetchEmailTemplate(id: string): Promise<EmailTemplate> {
  const res = await fetch(`/api/v1/email-templates/${id}`);
  if (!res.ok) throw new Error("Failed to fetch email template");
  return res.json();
}

async function createEmailTemplate(
  input: CreateEmailTemplateInput
): Promise<EmailTemplate> {
  const res = await fetch("/api/v1/email-templates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error("Failed to create email template");
  return res.json();
}

async function updateEmailTemplate({
  id,
  ...data
}: UpdateEmailTemplateInput): Promise<EmailTemplate> {
  const res = await fetch(`/api/v1/email-templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update email template");
  return res.json();
}

async function deleteEmailTemplate(id: string): Promise<void> {
  const res = await fetch(`/api/v1/email-templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete email template");
}

export function useEmailTemplates(category?: string) {
  return useQuery({
    queryKey: ["email-templates", category],
    queryFn: () => fetchEmailTemplates(category),
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: ["email-template", id],
    queryFn: () => fetchEmailTemplate(id),
    enabled: !!id,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEmailTemplate,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      queryClient.invalidateQueries({ queryKey: ["email-template", data.id] });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}

export const EMAIL_TEMPLATE_CATEGORIES: Record<EmailTemplate["category"], string> = {
  GENERAL: "General",
  FOLLOW_UP: "Suivi",
  REMINDER: "Rappel",
  CONFIRMATION: "Confirmation",
  REACTIVATION: "Reactivation",
};
