"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAutomationRules() {
  return useQuery({
    queryKey: ["automation-rules"],
    queryFn: async () => {
      const res = await fetch("/api/v1/automations");
      if (!res.ok) throw new Error("Erreur chargement regles");
      return res.json();
    },
  });
}

export function useAutomationStats() {
  return useQuery({
    queryKey: ["automation-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/automations?stats=true");
      if (!res.ok) throw new Error("Erreur chargement stats");
      return res.json();
    },
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur creation regle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
  });
}

export function useToggleAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/v1/automations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Erreur toggle regle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
  });
}

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/automations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression regle");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automation-rules"] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
  });
}

export function useAutomationLogs(filters: {
  ruleId?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return useQuery({
    queryKey: ["automation-logs", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/automations/logs?${params}`);
      if (!res.ok) throw new Error("Erreur chargement logs");
      return res.json();
    },
  });
}

// ── Campaigns ──────────────────────────────

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch("/api/v1/campaigns");
      if (!res.ok) throw new Error("Erreur chargement campagnes");
      return res.json();
    },
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur creation campagne");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/v1/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour campagne");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression campagne");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["automation-stats"] });
    },
  });
}
