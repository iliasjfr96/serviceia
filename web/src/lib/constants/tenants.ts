export const TENANT_PLAN_LABELS: Record<string, string> = {
  STARTER: "Starter",
  PROFESSIONAL: "Professionnel",
  ENTERPRISE: "Entreprise",
};

export const TENANT_PLAN_COLORS: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-800",
  PROFESSIONAL: "bg-blue-100 text-blue-800",
  ENTERPRISE: "bg-purple-100 text-purple-800",
};

export const TENANT_PLAN_FEATURES: Record<string, string[]> = {
  STARTER: [
    "1 utilisateur",
    "100 appels/mois",
    "CRM basique",
    "Agenda",
  ],
  PROFESSIONAL: [
    "5 utilisateurs",
    "500 appels/mois",
    "CRM complet + Kanban",
    "Agenda + integrations",
    "Automatisations",
  ],
  ENTERPRISE: [
    "Utilisateurs illimites",
    "Appels illimites",
    "CRM complet + API",
    "Toutes integrations",
    "Automatisations avancees",
    "Support prioritaire",
  ],
};

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Administrateur",
  MEMBER: "Membre",
};

export const USER_ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-red-100 text-red-800",
  ADMIN: "bg-blue-100 text-blue-800",
  MEMBER: "bg-gray-100 text-gray-800",
};
