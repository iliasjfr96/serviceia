"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCabinet() {
  return useQuery({
    queryKey: ["cabinet"],
    queryFn: async () => {
      const res = await fetch("/api/v1/cabinet");
      if (!res.ok) throw new Error("Erreur chargement cabinet");
      return res.json();
    },
  });
}

export function useUpdateCabinet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/cabinet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour cabinet");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinet"] });
    },
  });
}
