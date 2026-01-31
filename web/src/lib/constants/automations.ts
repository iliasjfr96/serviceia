export const AUTOMATION_TYPE_LABELS: Record<string, string> = {
  FOLLOW_UP: "Suivi prospect",
  REMINDER: "Rappel RDV",
  REACTIVATION: "Reactivation",
  NOTIFICATION: "Notification",
  NO_SHOW: "Gestion no-show",
};

export const AUTOMATION_TYPE_DESCRIPTIONS: Record<string, string> = {
  FOLLOW_UP: "Envoyer des relances aux prospects non convertis",
  REMINDER: "Rappeler les RDV a venir aux prospects",
  REACTIVATION: "Recontacter les prospects inactifs",
  NOTIFICATION: "Alerter l'equipe sur certains evenements",
  NO_SHOW: "Gerer les absences aux rendez-vous",
};

export const AUTOMATION_ACTION_LABELS: Record<string, string> = {
  SEND_EMAIL: "Envoyer un email",
  SEND_SMS: "Envoyer un SMS",
  INTERNAL_NOTIFICATION: "Notification interne",
  CHANGE_STAGE: "Changer l'etape",
  CREATE_TASK: "Creer une tache",
};

export const AUTOMATION_LOG_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  EXECUTING: "En cours",
  SUCCESS: "Reussi",
  FAILED: "Echoue",
  SKIPPED: "Ignore",
};

export const AUTOMATION_LOG_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  EXECUTING: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  SKIPPED: "bg-gray-100 text-gray-800",
};

export const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  REACTIVATION: "Reactivation",
  FOLLOW_UP: "Suivi",
  ANNOUNCEMENT: "Annonce",
};

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Brouillon",
  SCHEDULED: "Planifiee",
  ACTIVE: "Active",
  PAUSED: "En pause",
  COMPLETED: "Terminee",
};

export const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  SCHEDULED: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-green-100 text-green-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-purple-100 text-purple-800",
};

export const CAMPAIGN_CHANNEL_LABELS: Record<string, string> = {
  EMAIL: "Email",
  SMS: "SMS",
  EMAIL_SMS: "Email + SMS",
};

// Predefined automation templates
export const AUTOMATION_TEMPLATES = [
  {
    name: "Relance J+1 apres appel",
    type: "FOLLOW_UP",
    actionType: "SEND_EMAIL",
    triggerConfig: { event: "call_ended", delay: "1d", condition: "not_converted" },
    actionConfig: {
      subject: "Suite a notre echange",
      template: "follow_up_call",
    },
  },
  {
    name: "Relance J+3 sans reponse",
    type: "FOLLOW_UP",
    actionType: "SEND_EMAIL",
    triggerConfig: { event: "no_response", delay: "3d", condition: "not_converted" },
    actionConfig: {
      subject: "Avez-vous des questions ?",
      template: "follow_up_no_response",
    },
  },
  {
    name: "Rappel RDV J-1",
    type: "REMINDER",
    actionType: "SEND_SMS",
    triggerConfig: { event: "appointment_upcoming", delay: "-1d" },
    actionConfig: {
      template: "reminder_appointment_j1",
    },
  },
  {
    name: "Rappel RDV H-2",
    type: "REMINDER",
    actionType: "SEND_SMS",
    triggerConfig: { event: "appointment_upcoming", delay: "-2h" },
    actionConfig: {
      template: "reminder_appointment_h2",
    },
  },
  {
    name: "Reactivation inactifs 30j",
    type: "REACTIVATION",
    actionType: "SEND_EMAIL",
    triggerConfig: { event: "prospect_inactive", delay: "30d" },
    actionConfig: {
      subject: "Nous pensons a vous",
      template: "reactivation_30d",
    },
  },
  {
    name: "Alerte no-show",
    type: "NO_SHOW",
    actionType: "INTERNAL_NOTIFICATION",
    triggerConfig: { event: "appointment_no_show" },
    actionConfig: {
      message: "Un prospect n'est pas venu a son RDV",
      notifyAdmin: true,
    },
  },
];
