"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useIntegrations() {
  return useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const res = await fetch("/api/v1/integrations");
      if (!res.ok) throw new Error("Erreur chargement integrations");
      return res.json();
    },
  });
}

export function useIntegrationStatus() {
  return useQuery({
    queryKey: ["integration-status"],
    queryFn: async () => {
      const res = await fetch("/api/v1/integrations?status=true");
      if (!res.ok) throw new Error("Erreur chargement statut");
      return res.json();
    },
  });
}

export function useUpdateIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/v1/integrations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour integration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
    },
  });
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/integrations/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression integration");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      queryClient.invalidateQueries({ queryKey: ["integration-status"] });
    },
  });
}
