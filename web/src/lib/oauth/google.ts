/**
 * Google OAuth2 utilities for Calendar integration
 */

import { createHmac } from "crypto";
import { getEnv } from "../env";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
].join(" ");

interface OAuthState {
  tenantId: string;
  timestamp: number;
  hmac: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  picture?: string;
}

/**
 * Generate a secure state parameter for OAuth
 * Contains tenantId + timestamp + HMAC signature
 */
export function generateGoogleState(tenantId: string): string {
  const env = getEnv();
  const timestamp = Date.now();
  const payload = `${tenantId}:${timestamp}`;

  const hmac = createHmac("sha256", env.NEXTAUTH_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 16);

  const state: OAuthState = {
    tenantId,
    timestamp,
    hmac,
  };

  return Buffer.from(JSON.stringify(state)).toString("base64url");
}

/**
 * Verify and decode the OAuth state parameter
 * Returns null if invalid or expired (5 min timeout)
 */
export function verifyGoogleState(stateParam: string): { tenantId: string } | null {
  try {
    const env = getEnv();
    const decoded = Buffer.from(stateParam, "base64url").toString("utf-8");
    const state: OAuthState = JSON.parse(decoded);

    // Check timestamp (5 minute expiry)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - state.timestamp > fiveMinutes) {
      console.error("[Google OAuth] State expired");
      return null;
    }

    // Verify HMAC
    const payload = `${state.tenantId}:${state.timestamp}`;
    const expectedHmac = createHmac("sha256", env.NEXTAUTH_SECRET)
      .update(payload)
      .digest("hex")
      .slice(0, 16);

    if (state.hmac !== expectedHmac) {
      console.error("[Google OAuth] Invalid HMAC");
      return null;
    }

    return { tenantId: state.tenantId };
  } catch (error) {
    console.error("[Google OAuth] Failed to parse state:", error);
    return null;
  }
}

/**
 * Get the Google OAuth consent URL
 */
export function getGoogleAuthUrl(state: string, redirectUri: string): string {
  const env = getEnv();

  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID not configured");
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // Get refresh token
    prompt: "consent", // Always show consent screen to get refresh token
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const env = getEnv();

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Google OAuth] Token exchange failed:", error);
    throw new Error("Failed to exchange code for tokens");
  }

  return response.json();
}

/**
 * Refresh an expired access token
 */
export async function refreshGoogleToken(
  refreshToken: string
): Promise<GoogleTokenResponse> {
  const env = getEnv();

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("[Google OAuth] Token refresh failed:", error);
    throw new Error("Failed to refresh token");
  }

  return response.json();
}

/**
 * Get user info (email) from Google
 */
export async function getGoogleUserEmail(accessToken: string): Promise<string> {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info");
  }

  const data: GoogleUserInfo = await response.json();
  return data.email;
}

/**
 * Check if Google OAuth is configured
 */
export function isGoogleOAuthConfigured(): boolean {
  const env = getEnv();
  return !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
