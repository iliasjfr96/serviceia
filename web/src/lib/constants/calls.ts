export const CALL_STATUS_LABELS: Record<string, string> = {
  RINGING: "En cours",
  IN_PROGRESS: "En cours",
  COMPLETED: "Termine",
  FAILED: "Echoue",
  MISSED: "Manque",
  TRANSFERRED: "Transfere",
};

export const CALL_STATUS_COLORS: Record<string, string> = {
  RINGING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  MISSED: "bg-orange-100 text-orange-800",
  TRANSFERRED: "bg-purple-100 text-purple-800",
};

export const CALL_DIRECTION_LABELS: Record<string, string> = {
  INBOUND: "Entrant",
  OUTBOUND: "Sortant",
};

export const CALL_DIRECTION_ICONS: Record<string, string> = {
  INBOUND: "PhoneIncoming",
  OUTBOUND: "PhoneOutgoing",
};
