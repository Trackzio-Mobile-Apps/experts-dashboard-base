/** Backend socket event payload — IDs only; REST is source of truth. */
export type ExpertSocketEventPayload = {
  offerId?: string;
  requestId?: string;
  round?: number;
  expiresAt?: string;
};

export type ExpertSocketConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

export const EXPERT_SOCKET_EVENTS = {
  offered: "request.offered",
  withdrawn: "request.withdrawn",
  accepted: "request.accepted",
  deadlineMissed: "request.deadline_missed",
} as const;
