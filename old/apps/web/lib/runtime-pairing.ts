import { randomBytes, randomUUID } from "node:crypto";

import type {
  RuntimeHostKind,
  RuntimePairingStartRequest,
  RuntimePairingStartResponse,
  RuntimePairingStatus,
  RuntimePairingStatusResponse,
  RuntimeUserIdentity,
} from "@grapeee/shared-types";

const PAIRING_TTL_MS = 10 * 60 * 1000;
const POLL_INTERVAL_SECONDS = 2;
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

interface PairingRecord {
  pairingId: string;
  pollToken: string;
  code: string;
  deviceName: string;
  hostKind: RuntimeHostKind;
  verificationUrl: string;
  expiresAt: string;
  status: RuntimePairingStatus;
  authorizedAt?: string;
  runtimeToken?: string;
  user?: RuntimeUserIdentity;
}

const pairingRecords = new Map<string, PairingRecord>();

function generateToken(byteLength = 24) {
  return randomBytes(byteLength).toString("base64url");
}

function generateCode() {
  const bytes = randomBytes(8);
  let out = "";

  for (const byte of bytes) {
    out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }

  return `${out.slice(0, 4)}-${out.slice(4, 8)}`;
}

function getAppBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.BETTER_AUTH_URL
    ?? "http://localhost:3001";
}

function cleanupExpiredPairings() {
  const now = Date.now();

  for (const [pairingId, record] of pairingRecords.entries()) {
    if (Date.parse(record.expiresAt) <= now && record.status !== "authorized") {
      pairingRecords.set(pairingId, {
        ...record,
        status: "expired",
      });
    }

    if (Date.parse(record.expiresAt) + PAIRING_TTL_MS <= now) {
      pairingRecords.delete(pairingId);
    }
  }
}

function toStatusResponse(record: PairingRecord): RuntimePairingStatusResponse {
  return {
    pairingId: record.pairingId,
    status: record.status,
    deviceName: record.deviceName,
    hostKind: record.hostKind,
    code: record.code,
    verificationUrl: record.verificationUrl,
    expiresAt: record.expiresAt,
    authorizedAt: record.authorizedAt,
    runtimeToken: record.runtimeToken,
    user: record.user,
  };
}

export function createRuntimePairing(
  input: RuntimePairingStartRequest = {},
): RuntimePairingStartResponse {
  cleanupExpiredPairings();

  const pairingId = randomUUID();
  const expiresAt = new Date(Date.now() + PAIRING_TTL_MS).toISOString();
  const hostKind = input.hostKind ?? "daemon";
  const deviceName = input.deviceName?.trim() || "Local Grapeee runtime";
  const verificationUrl = `${getAppBaseUrl()}/connect/runtime?pairingId=${encodeURIComponent(pairingId)}`;

  const record: PairingRecord = {
    pairingId,
    pollToken: generateToken(),
    code: generateCode(),
    deviceName,
    hostKind,
    verificationUrl,
    expiresAt,
    status: "pending",
  };

  pairingRecords.set(pairingId, record);

  return {
    pairingId: record.pairingId,
    pollToken: record.pollToken,
    code: record.code,
    deviceName: record.deviceName,
    hostKind: record.hostKind,
    verificationUrl: record.verificationUrl,
    intervalSeconds: POLL_INTERVAL_SECONDS,
    expiresAt: record.expiresAt,
  };
}

export function getRuntimePairingForBrowser(pairingId: string) {
  cleanupExpiredPairings();
  return pairingRecords.get(pairingId) ?? null;
}

export function getRuntimePairingStatus(pairingId: string, pollToken: string) {
  cleanupExpiredPairings();

  const record = pairingRecords.get(pairingId);
  if (!record || record.pollToken !== pollToken) {
    return null;
  }

  return toStatusResponse(record);
}

export function authorizeRuntimePairing(pairingId: string, user: RuntimeUserIdentity) {
  cleanupExpiredPairings();

  const record = pairingRecords.get(pairingId);
  if (!record) {
    return null;
  }

  if (record.status === "expired") {
    return toStatusResponse(record);
  }

  if (record.status === "authorized") {
    return toStatusResponse(record);
  }

  const updated: PairingRecord = {
    ...record,
    status: "authorized",
    authorizedAt: new Date().toISOString(),
    runtimeToken: generateToken(32),
    user,
  };

  pairingRecords.set(pairingId, updated);
  return toStatusResponse(updated);
}
