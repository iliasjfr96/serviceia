"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── RGPD Stats ──────────────────────────────

export function useRgpdStats() {
  return useQuery({
    queryKey: ["rgpd-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/rgpd/stats");
      if (!res.ok) throw new Error("Erreur chargement stats RGPD");
      return res.json();
    },
  });
}

// ── Retention Settings ──────────────────────────────

export function useRetentionSettings() {
  return useQuery({
    queryKey: ["rgpd-retention"],
    queryFn: async () => {
      const res = await fetch("/api/v1/rgpd/retention");
      if (!res.ok) throw new Error("Erreur chargement parametres retention");
      return res.json();
    },
  });
}

export function useUpdateRetentionSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/rgpd/retention", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour retention");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rgpd-retention"] });
      queryClient.invalidateQueries({ queryKey: ["rgpd-stats"] });
    },
  });
}

// ── Consent Records ──────────────────────────────

export function useConsentRecords(filters: {
  prospectId?: string;
  consentType?: string;
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
    queryKey: ["rgpd-consents", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/rgpd/consents?${params}`);
      if (!res.ok) throw new Error("Erreur chargement consentements");
      return res.json();
    },
  });
}

export function useRevokeConsent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/rgpd/consents/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur revocation consentement");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rgpd-consents"] });
      queryClient.invalidateQueries({ queryKey: ["rgpd-stats"] });
    },
  });
}

// ── Data Export ──────────────────────────────

export function useExportProspectData() {
  return useMutation({
    mutationFn: async (prospectId: string) => {
      const res = await fetch(`/api/v1/rgpd/export/${prospectId}`);
      if (!res.ok) throw new Error("Erreur export donnees");
      return res.json();
    },
  });
}

// ── Data Erasure ──────────────────────────────

export function useEraseProspectData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prospectId: string) => {
      const res = await fetch(`/api/v1/rgpd/erase/${prospectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur effacement donnees");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rgpd-stats"] });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}

// ── Cleanup ──────────────────────────────

export function useCleanupExpiredData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/v1/rgpd/cleanup", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur nettoyage");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rgpd-stats"] });
      queryClient.invalidateQueries({ queryKey: ["prospects"] });
    },
  });
}
