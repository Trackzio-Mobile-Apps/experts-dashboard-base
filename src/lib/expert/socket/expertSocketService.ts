"use client";

import { io, type Socket } from "socket.io-client";
import {
  clearExpertSocketBaseUrlCache,
  getExpertSocketBaseUrlFromEnv,
  logExpertSocketStartup,
  resetExpertSocketStartupLog,
  resolveExpertSocketBaseUrl,
} from "@/lib/expert/socket/expertSocketEnv";
import {
  EXPERT_SOCKET_EVENTS,
  type ExpertSocketConnectionState,
  type ExpertSocketEventPayload,
} from "@/lib/expert/socket/types";

export type ExpertSocketHandlers = {
  onConnectionStateChange: (state: ExpertSocketConnectionState) => void;
  onOffered: (payload: ExpertSocketEventPayload) => void;
  onWithdrawn: (payload: ExpertSocketEventPayload) => void;
  onAccepted: (payload: ExpertSocketEventPayload) => void;
  onDeadlineMissed: (payload: ExpertSocketEventPayload) => void;
};

type ConnectExpertSocketOptions = {
  expertId: string;
  baseUrl: string;
  handlers: ExpertSocketHandlers;
};

let socket: Socket | null = null;
let connectedExpertId: string | null = null;
let activeHandlers: ExpertSocketHandlers | null = null;
let connectGeneration = 0;

const LOG_PREFIX = "[expert-socket]";

function log(message: string, detail?: unknown): void {
  if (detail !== undefined) {
    console.log(LOG_PREFIX, message, detail);
    return;
  }
  console.log(LOG_PREFIX, message);
}

function normalizePayload(raw: unknown): ExpertSocketEventPayload {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const record = raw as Record<string, unknown>;
  const payload: ExpertSocketEventPayload = {};

  if (typeof record.offerId === "string" && record.offerId.trim()) {
    payload.offerId = record.offerId.trim();
  }
  if (typeof record.requestId === "string" && record.requestId.trim()) {
    payload.requestId = record.requestId.trim();
  }
  if (typeof record.round === "number" && Number.isFinite(record.round)) {
    payload.round = record.round;
  }
  if (typeof record.expiresAt === "string" && record.expiresAt.trim()) {
    payload.expiresAt = record.expiresAt.trim();
  }

  return payload;
}

function notifyConnectionState(state: ExpertSocketConnectionState): void {
  activeHandlers?.onConnectionStateChange(state);
}

function bindSocketHandlers(): void {
  if (!socket || !activeHandlers) return;

  socket.off(EXPERT_SOCKET_EVENTS.offered);
  socket.off(EXPERT_SOCKET_EVENTS.withdrawn);
  socket.off(EXPERT_SOCKET_EVENTS.accepted);
  socket.off(EXPERT_SOCKET_EVENTS.deadlineMissed);

  socket.on(EXPERT_SOCKET_EVENTS.offered, (raw: unknown) => {
    const payload = normalizePayload(raw);
    log("event: request.offered", payload);
    activeHandlers?.onOffered(payload);
  });
  socket.on(EXPERT_SOCKET_EVENTS.withdrawn, (raw: unknown) => {
    const payload = normalizePayload(raw);
    log("event: request.withdrawn", payload);
    activeHandlers?.onWithdrawn(payload);
  });
  socket.on(EXPERT_SOCKET_EVENTS.accepted, (raw: unknown) => {
    const payload = normalizePayload(raw);
    log("event: request.accepted", payload);
    activeHandlers?.onAccepted(payload);
  });
  socket.on(EXPERT_SOCKET_EVENTS.deadlineMissed, (raw: unknown) => {
    const payload = normalizePayload(raw);
    log("event: request.deadline_missed", payload);
    activeHandlers?.onDeadlineMissed(payload);
  });
}

function bindLifecycleHandlers(baseUrl: string): void {
  if (!socket) return;

  socket.off("connect");
  socket.off("disconnect");
  socket.off("connect_error");
  socket.io.off("reconnect_attempt");
  socket.io.off("reconnect");
  socket.io.off("reconnect_failed");

  socket.on("connect", () => {
    log("connected", {
      socketId: socket?.id,
      expertId: connectedExpertId,
      transport: socket?.io.engine?.transport?.name,
    });
    notifyConnectionState("connected");
  });

  socket.on("disconnect", (reason) => {
    log("disconnected", { reason, expertId: connectedExpertId });
    notifyConnectionState("disconnected");
  });

  socket.on("connect_error", (error) => {
    log("connect_error — polling fallback will be used", {
      message: error.message,
      expertId: connectedExpertId,
      url: baseUrl,
    });
    notifyConnectionState("disconnected");
  });

  socket.io.on("reconnect_attempt", (attempt) => {
    log("reconnect_attempt", { attempt, expertId: connectedExpertId });
    notifyConnectionState("reconnecting");
  });

  socket.io.on("reconnect", (attempt) => {
    log("reconnected", { attempt, socketId: socket?.id });
    notifyConnectionState("connected");
  });

  socket.io.on("reconnect_failed", () => {
    log("reconnect_failed — polling fallback will be used");
    notifyConnectionState("disconnected");
  });
}

function destroySocketConnection(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.io.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connectedExpertId = null;
}

/** @deprecated Prefer resolveExpertSocketBaseUrl — kept for connect_error logs. */
export function getExpertSocketBaseUrl(): string {
  return getExpertSocketBaseUrlFromEnv();
}

export function isExpertSocketConnected(): boolean {
  return Boolean(socket?.connected);
}

export function getConnectedExpertSocketId(): string | null {
  return connectedExpertId;
}

function connectExpertSocketWithUrl({
  expertId,
  baseUrl,
  handlers,
}: ConnectExpertSocketOptions): void {
  activeHandlers = handlers;

  if (socket && connectedExpertId === expertId) {
    bindSocketHandlers();
    handlers.onConnectionStateChange(
      socket.connected ? "connected" : "reconnecting",
    );
    return;
  }

  destroySocketConnection();
  connectedExpertId = expertId;
  notifyConnectionState("connecting");
  log("connection attempt", { url: baseUrl, expertId });

  socket = io(baseUrl, {
    auth: { expertId },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    autoConnect: true,
  });

  bindLifecycleHandlers(baseUrl);
  bindSocketHandlers();
}

/**
 * Resolve socket URL, then connect the singleton.
 * Safe for React Strict Mode — cleanup detaches handlers without destroying socket.
 */
export async function resolveAndConnectExpertSocket(options: {
  expertId: string;
  handlers: ExpertSocketHandlers;
  signal?: AbortSignal;
}): Promise<() => void> {
  const generation = ++connectGeneration;
  const envUrl = getExpertSocketBaseUrlFromEnv();
  const baseUrl = envUrl || (await resolveExpertSocketBaseUrl());

  if (options.signal?.aborted || generation !== connectGeneration) {
    return () => {};
  }

  const source = envUrl ? "env" : baseUrl ? "server-config" : "missing";
  logExpertSocketStartup({
    url: baseUrl,
    expertId: options.expertId,
    source,
  });

  if (!baseUrl || !options.expertId.trim()) {
    log("not connecting — missing socket URL or expert id", {
      baseUrl: baseUrl || "(empty)",
      expertId: options.expertId || "(empty)",
      envUrl: envUrl || "(empty)",
    });
    options.handlers.onConnectionStateChange("disconnected");
    return () => {};
  }

  connectExpertSocketWithUrl({
    expertId: options.expertId,
    baseUrl,
    handlers: options.handlers,
  });

  return () => {
    detachExpertSocketHandlers(options.handlers);
  };
}

/** Detach React handlers without closing the socket (Strict Mode safe). */
export function detachExpertSocketHandlers(handlers?: ExpertSocketHandlers): void {
  if (!handlers || activeHandlers === handlers) {
    activeHandlers = null;
  }
}

export function disconnectExpertSocket(): void {
  connectGeneration += 1;
  destroySocketConnection();
  activeHandlers = null;
  clearExpertSocketBaseUrlCache();
  resetExpertSocketStartupLog();
  notifyConnectionState("disconnected");
}

export function updateExpertSocketHandlers(handlers: ExpertSocketHandlers): void {
  activeHandlers = handlers;
  bindSocketHandlers();
}

/** @deprecated Use resolveAndConnectExpertSocket */
export function connectExpertSocket(options: {
  expertId: string;
  handlers: ExpertSocketHandlers;
}): () => void {
  const baseUrl = getExpertSocketBaseUrlFromEnv();
  if (!baseUrl || !options.expertId.trim()) {
    options.handlers.onConnectionStateChange("disconnected");
    return () => {};
  }

  connectExpertSocketWithUrl({
    expertId: options.expertId,
    baseUrl,
    handlers: options.handlers,
  });

  return () => {
    detachExpertSocketHandlers(options.handlers);
  };
}
