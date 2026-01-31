"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ProspectFilters {
  stage?: string;
  practiceAreaId?: string;
  urgencyLevel?: string;
  source?: string;
  search?: string;
  hasRecentCalls?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export function useProspects(filters: ProspectFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return useQuery({
    queryKey: ["prospects", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/prospects?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des prospects");
      return res.json();
    },
  });
}

export function useProspect(id: string) {
  return useQuery({
    queryKey: ["prospect", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/prospects/${id}`);
      if (!res.ok) throw new Error("Prospect non trouve");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de la creation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}

export function useUpdateProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/v1/prospects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise a jour");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({
        queryKey: ["prospect", variables.id],
      });
    },
  });
}

export function useUpdateProspectStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch(`/api/v1/prospects/${id}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Erreur lors du changement de statut");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({
        queryKey: ["prospect", variables.id],
      });
    },
  });
}

export function useDeleteProspect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/prospects/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}

export function useProspectStats() {
  return useQuery({
    queryKey: ["prospect-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/prospects/stats");
      if (!res.ok) throw new Error("Erreur lors du chargement des stats");
      return res.json();
    },
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      action,
      prospectIds,
      stage,
    }: {
      action: "updateStage" | "delete";
      prospectIds: string[];
      stage?: string;
    }) => {
      const res = await fetch("/api/v1/prospects/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, prospectIds, stage }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'action groupee");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-stats"] });
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prospectId,
      content,
      type,
    }: {
      prospectId: string;
      content: string;
      type?: string;
    }) => {
      const res = await fetch(`/api/v1/prospects/${prospectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout de la note");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["prospect", variables.prospectId],
      });
    },
  });
}

// ── Quick Actions (Callback workflow) ──────────────────────────────

interface QuickActionData {
  action: "CANCELLED" | "APPOINTMENT_CONFIRMED";
  appointmentDate?: string;
  appointmentTime?: string;
  notes?: string;
}

export function useQuickAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      prospectId,
      data,
    }: {
      prospectId: string;
      data: QuickActionData;
    }) => {
      const res = await fetch(`/api/v1/prospects/${prospectId}/quick-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erreur lors de l'action");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
      queryClient.invalidateQueries({
        queryKey: ["prospect", variables.prospectId],
      });
      queryClient.invalidateQueries({ queryKey: ["prospect-stats"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
