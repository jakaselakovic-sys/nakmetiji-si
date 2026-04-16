// =============================================================================
// NaKmetiji.si — JWS (JSON Web Signature) Token Utility
// Tamper-proof magic links for farmer booking approval
//
// Uses `jose` library (HMAC SHA-256) for:
//   • Signing: booking data → compact JWS token
//   • Verifying: JWS token → validated payload (or throws)
//
// Security properties:
//   1. booking_id and price CANNOT be modified in the URL
//   2. 48h TTL — link expires automatically
//   3. HS256 with 32+ byte secret — bank-grade integrity
// =============================================================================

import { SignJWT, jwtVerify, errors } from "jose";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApprovalPayload {
  /** Booking UUID */
  bid: string;
  /** Farm UUID */
  fid: string;
  /** Total price in EUR (fixed at booking time) */
  price: number;
  /** Guest name */
  guest: string;
  /** Guest email */
  email: string;
  /** Number of guests */
  guests: number;
  /** Check-in date ISO */
  dateFrom: string;
  /** Check-out date ISO */
  dateTo: string;
  /** Farm name for display */
  farmName: string;
  /** Pantry add-ons */
  addons?: { label: string; price: number }[];
}

// ─── Secret key ─────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.JWS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "[JWS] JWS_SECRET env variable is missing or too short (min 32 chars). " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(48).toString('base64'))\""
    );
  }
  return new TextEncoder().encode(secret);
}

// ─── TTL ────────────────────────────────────────────────────────────────────

const TTL_HOURS = 48;

// ─── Sign ───────────────────────────────────────────────────────────────────

/**
 * Creates a tamper-proof JWS token for booking approval.
 * Encodes booking_id, price, and all relevant data into the payload.
 * Token expires after 48 hours.
 */
export async function signApprovalToken(
  payload: ApprovalPayload
): Promise<string> {
  const secret = getSecret();

  const token = await new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_HOURS}h`)
    .setIssuer("nakmetiji.si")
    .setSubject(payload.bid)
    .sign(secret);

  return token;
}

// ─── Verify ─────────────────────────────────────────────────────────────────

export type VerifyResult =
  | { ok: true; payload: ApprovalPayload }
  | { ok: false; error: "expired" | "invalid" | "malformed" };

/**
 * Verifies a JWS token and extracts the booking approval payload.
 * Returns structured error codes for UX differentiation.
 */
export async function verifyApprovalToken(
  token: string
): Promise<VerifyResult> {
  try {
    const secret = getSecret();

    const { payload } = await jwtVerify(token, secret, {
      issuer: "nakmetiji.si",
    });

    // Validate required fields
    const p = payload as unknown as ApprovalPayload;
    if (!p.bid || !p.fid || typeof p.price !== "number") {
      return { ok: false, error: "malformed" };
    }

    return { ok: true, payload: p };
  } catch (err) {
    if (err instanceof errors.JWTExpired) {
      return { ok: false, error: "expired" };
    }
    return { ok: false, error: "invalid" };
  }
}
