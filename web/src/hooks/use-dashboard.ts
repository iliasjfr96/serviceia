"use client";

import { useQuery } from "@tanstack/react-query";

export function useDashboardKPIs() {
  return useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard");
      if (!res.ok) throw new Error("Erreur chargement KPIs");
      return res.json();
    },
    refetchInterval: 60000, // refresh every minute
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ["dashboard-charts"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard?section=charts");
      if (!res.ok) throw new Error("Erreur chargement graphiques");
      return res.json();
    },
    refetchInterval: 300000, // refresh every 5 minutes
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard-activity"],
    queryFn: async () => {
      const res = await fetch("/api/v1/dashboard?section=activity");
      if (!res.ok) throw new Error("Erreur chargement activite");
      return res.json();
    },
    refetchInterval: 30000, // refresh every 30 seconds
  });
}
