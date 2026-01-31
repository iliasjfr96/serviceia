export const STAGE_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  TO_CALLBACK: "A rappeler",
  QUALIFIED: "Qualifie",
  APPOINTMENT: "RDV confirme",
  CLIENT: "Client",
  DOSSIER: "Dossier",
  CLOSED: "Cloture",
  LOST: "Annule",
};

export const STAGE_COLORS: Record<string, string> = {
  NEW: "bg-cyan-100 text-cyan-800",
  TO_CALLBACK: "bg-orange-100 text-orange-800",
  QUALIFIED: "bg-yellow-100 text-yellow-800",
  APPOINTMENT: "bg-purple-100 text-purple-800",
  CLIENT: "bg-green-100 text-green-800",
  DOSSIER: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-gray-100 text-gray-800",
  LOST: "bg-red-100 text-red-800",
};

export const URGENCY_LABELS: Record<string, string> = {
  LOW: "Faible",
  NORMAL: "Normal",
  HIGH: "Eleve",
  CRITICAL: "Critique",
};

export const URGENCY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

export const SOURCE_LABELS: Record<string, string> = {
  CALL_AI: "Appel IA",
  CALL_MANUAL: "Appel manuel",
  WEBSITE: "Site web",
  REFERRAL: "Recommandation",
  WALK_IN: "Sans RDV",
  EMAIL: "Email",
  OTHER: "Autre",
};

export const STAGES_ORDER = [
  "NEW",
  "TO_CALLBACK",
  "QUALIFIED",
  "APPOINTMENT",
  "CLIENT",
  "DOSSIER",
  "CLOSED",
  "LOST",
] as const;

// System list names (auto-created)
export const SYSTEM_LISTS = {
  TO_CALLBACK: "A rappeler",
  APPOINTMENT_CONFIRMED: "RDV confirmes",
  CANCELLED: "Annules",
} as const;
