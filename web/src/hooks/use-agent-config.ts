"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useAgentConfig() {
  return useQuery({
    queryKey: ["agent-config"],
    queryFn: async () => {
      const res = await fetch("/api/v1/agent-config");
      if (!res.ok) throw new Error("Erreur chargement config agent");
      return res.json();
    },
  });
}

export function useUpdateAgentConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/agent-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur mise a jour config agent");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-config"] });
    },
  });
}
