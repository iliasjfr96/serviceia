"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Admin Stats ──────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/admin/stats");
      if (!res.ok) throw new Error("Erreur chargement stats admin");
      return res.json();
    },
    refetchInterval: 60000,
  });
}

// ── Tenants ──────────────────────────────

export function useTenants(filters: {
  search?: string;
  plan?: string;
  isActive?: string;
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
    queryKey: ["admin-tenants", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/tenants?${params}`);
      if (!res.ok) throw new Error("Erreur chargement tenants");
      return res.json();
    },
  });
}

export function useTenant(id: string | null) {
  return useQuery({
    queryKey: ["admin-tenant", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/tenants/${id}`);
      if (!res.ok) throw new Error("Erreur chargement tenant");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur creation tenant");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/v1/admin/tenants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour tenant");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenant"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useOnboardTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/admin/tenants/${id}/onboard`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Erreur onboarding");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tenant"] });
    },
  });
}

// ── Audit Logs ──────────────────────────────

export function useAuditLogs(filters: {
  tenantId?: string;
  action?: string;
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
    queryKey: ["admin-audit-logs", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/admin/audit-logs?${params}`);
      if (!res.ok) throw new Error("Erreur chargement audit logs");
      return res.json();
    },
  });
}
