"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useScripts() {
  return useQuery({
    queryKey: ["scripts"],
    queryFn: async () => {
      const res = await fetch("/api/v1/scripts");
      if (!res.ok) throw new Error("Erreur chargement scripts");
      return res.json();
    },
  });
}

export function usePracticeAreas() {
  return useQuery({
    queryKey: ["practice-areas"],
    queryFn: async () => {
      const res = await fetch("/api/v1/scripts?practiceAreas=true");
      if (!res.ok) throw new Error("Erreur chargement domaines");
      return res.json();
    },
  });
}

export function useCreateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/scripts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur creation script");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useUpdateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: Record<string, unknown> & { id: string }) => {
      const res = await fetch(`/api/v1/scripts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour script");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}

export function useDeleteScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/scripts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression script");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scripts"] });
    },
  });
}
