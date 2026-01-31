export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planifie",
  CONFIRMED: "Confirme",
  IN_PROGRESS: "En cours",
  COMPLETED: "Termine",
  CANCELLED: "Annule",
  NO_SHOW: "Absent",
  RESCHEDULED: "Replanifie",
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-orange-100 text-orange-800",
  RESCHEDULED: "bg-purple-100 text-purple-800",
};

export const BOOKED_BY_LABELS: Record<string, string> = {
  AI: "Agent IA",
  MANUAL: "Manuel",
  ONLINE: "En ligne",
};

export const CONSULTATION_TYPES = [
  { value: "premiere_consultation", label: "Premiere consultation" },
  { value: "suivi_dossier", label: "Suivi de dossier" },
  { value: "signature", label: "Signature de documents" },
  { value: "mediation", label: "Mediation" },
  { value: "audience", label: "Audience" },
  { value: "autre", label: "Autre" },
];

export const DAY_LABELS: Record<number, string> = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
};
