import { createHmac, randomUUID } from "crypto";

// ── Types ──────────────────────────────

interface OAuthState {
  tenantId: string;
  provider: "GOOGLE";
  nonce: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

// ── Configuration ──────────────────────────────

const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET || "dev-secret-change-in-prod";
}

// ── State Parameter (HMAC-signed, anti-CSRF) ──────────────────────────────

export function generateOAuthState(
  tenantId: string,
  provider: "GOOGLE"
): string {
  const nonce = randomUUID();
  const payload = `${tenantId}|${provider}|${nonce}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");

  const state: OAuthState & { sig: string } = {
    tenantId,
    provider,
    nonce,
    sig,
  };

  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

export function verifyOAuthState(
  stateParam: string
): OAuthState | null {
  try {
    const decoded = JSON.parse(
      Buffer.from(stateParam, "base64url").toString("utf-8")
    );

    const { tenantId, provider, nonce, sig } = decoded;
    if (!tenantId || !provider || !nonce || !sig) return null;

    const payload = `${tenantId}|${provider}|${nonce}`;
    const expectedSig = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    if (sig !== expectedSig) return null;

    return { tenantId, provider, nonce };
  } catch {
    return null;
  }
}

// ── Google OAuth URLs ──────────────────────────────

export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    redirect_uri: `${getBaseUrl()}/api/integrations/google/callback`,
    response_type: "code",
    scope: GOOGLE_SCOPES,
    state,
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// ── Google Token Exchange ──────────────────────────────

export async function exchangeGoogleCode(
  code: string
): Promise<TokenResponse> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirect_uri: `${getBaseUrl()}/api/integrations/google/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Google token exchange failed: ${error}`);
  }

  return res.json();
}

// ── Google User Info ──────────────────────────────

export async function getGoogleUserEmail(
  accessToken: string
): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch Google user info");
  }

  const data: GoogleUserInfo = await res.json();
  return data.email;
}
