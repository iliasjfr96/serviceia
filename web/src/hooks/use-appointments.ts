"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AppointmentFilters {
  status?: string;
  prospectId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export function useAppointments(filters: AppointmentFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  });

  return useQuery({
    queryKey: ["appointments", filters],
    queryFn: async () => {
      const res = await fetch(`/api/v1/appointments?${params}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des RDV");
      return res.json();
    },
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: ["appointment", id],
    queryFn: async () => {
      const res = await fetch(`/api/v1/appointments/${id}`);
      if (!res.ok) throw new Error("RDV non trouve");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useAppointmentStats() {
  return useQuery({
    queryKey: ["appointment-stats"],
    queryFn: async () => {
      const res = await fetch("/api/v1/appointments?stats=true");
      if (!res.ok) throw new Error("Erreur lors du chargement des stats");
      return res.json();
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erreur lors de la creation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/v1/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise a jour");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: ["appointment", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/v1/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur lors du changement de statut");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({
        queryKey: ["appointment", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/appointments/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment-stats"] });
    },
  });
}

// ── Availability ──────────────────────

export function useAvailabilitySlots() {
  return useQuery({
    queryKey: ["availability-slots"],
    queryFn: async () => {
      const res = await fetch("/api/v1/availability");
      if (!res.ok) throw new Error("Erreur lors du chargement des creneaux");
      return res.json();
    },
  });
}

export function useCreateAvailabilitySlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/v1/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de la creation du creneau");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
}

export function useDeleteAvailabilitySlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/availability/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["availability-slots"] });
    },
  });
}

export function useAvailableSlots(date: string) {
  return useQuery({
    queryKey: ["available-slots", date],
    queryFn: async () => {
      const res = await fetch(`/api/v1/availability/slots?date=${date}`);
      if (!res.ok) throw new Error("Erreur lors du chargement des creneaux");
      return res.json();
    },
    enabled: !!date,
  });
}
