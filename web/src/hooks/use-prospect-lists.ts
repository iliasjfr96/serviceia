"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useProspectLists() {
  return useQuery({
    queryKey: ["prospect-lists"],
    queryFn: async () => {
      const res = await fetch("/api/v1/prospect-lists");
      if (!res.ok) throw new Error("Erreur chargement listes");
      return res.json();
    },
  });
}

export function useProspectList(id: string) {
  return useQuery({
    queryKey: ["prospect-list", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/prospect-lists/${id}`);
      if (!res.ok) throw new Error("Erreur chargement liste");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      color?: string;
    }) => {
      const res = await fetch("/api/v1/prospect-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur creation liste");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
    },
  });
}

export function useUpdateProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      description?: string;
      color?: string;
    }) => {
      const res = await fetch(`/api/v1/prospect-lists/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour liste");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
    },
  });
}

export function useDeleteProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/prospect-lists/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression liste");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
    },
  });
}

export function useAddToProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      prospectIds,
    }: {
      listId: string;
      prospectIds: string[];
    }) => {
      const res = await fetch(`/api/v1/prospect-lists/${listId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectIds }),
      });
      if (!res.ok) throw new Error("Erreur ajout prospects");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-list"] });
    },
  });
}

export function useRemoveFromProspectList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      prospectId,
    }: {
      listId: string;
      prospectId: string;
    }) => {
      const res = await fetch(`/api/v1/prospect-lists/${listId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId }),
      });
      if (!res.ok) throw new Error("Erreur retrait prospect");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prospect-lists"] });
      queryClient.invalidateQueries({ queryKey: ["prospect-list"] });
    },
  });
}

export function useSearchProspectsForList(listId: string, search: string) {
  return useQuery({
    queryKey: ["prospect-list-search", listId, search],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/prospect-lists/${listId}/members?search=${encodeURIComponent(search)}`
      );
      if (!res.ok) throw new Error("Erreur recherche");
      return res.json();
    },
    enabled: !!listId && search.length >= 2,
  });
}
