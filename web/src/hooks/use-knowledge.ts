"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useKnowledgeDocuments(filters: {
  search?: string;
  page?: number;
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["knowledge", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));
      const res = await fetch(`/api/v1/knowledge?${params}`);
      if (!res.ok) throw new Error("Erreur chargement documents");
      return res.json();
    },
  });
}

export function useKnowledgeStats() {
  return useQuery({
    queryKey: ["knowledge-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/knowledge?stats=true");
      if (!res.ok) throw new Error("Erreur chargement stats");
      return res.json();
    },
  });
}

export function useCreateKnowledgeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur creation document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
    },
  });
}

export function useUpdateKnowledgeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/v1/knowledge/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
    },
  });
}

export function useDeleteKnowledgeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/knowledge/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression document");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-stats"] });
    },
  });
}
