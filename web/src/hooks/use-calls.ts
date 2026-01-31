"use client";

import { useQuery } from "@tanstack/react-query";

interface CallFilters {
  status?: string;
  direction?: string;
  isEmergency?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export function useCalls(filters: CallFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return useQuery({
    queryKey: ["calls", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/calls?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des appels");
      return res.json();
    },
  });
}

export function useCall(id: string) {
  return useQuery({
    queryKey: ["call", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/calls/${id}`);
      if (!res.ok) throw new Error("Appel non trouve");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCallStats() {
  return useQuery({
    queryKey: ["call-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/calls?stats=true");
      if (!res.ok) throw new Error("Erreur stats appels");
      return res.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: false,
  });
}
