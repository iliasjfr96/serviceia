import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  verifyGoogleState,
  exchangeGoogleCode,
  getGoogleUserEmail,
} from "@/lib/oauth/google";
import { upsertIntegration } from "@/lib/dal/integrations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denial
    if (error) {
      console.error("[Google Callback] User denied access:", error);
      return NextResponse.redirect(
        new URL("/parametres/integrations?error=access_denied", request.url)
      );
    }

    // Validate required params
    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/parametres/integrations?error=invalid_request", request.url)
      );
    }

    // Verify state (CSRF protection + tenant ID)
    const stateData = verifyGoogleState(state);
    if (!stateData) {
      return NextResponse.redirect(
        new URL("/parametres/integrations?error=invalid_state", request.url)
      );
    }

    // Verify session matches state tenant
    const session = await auth();
    if (!session?.user?.tenantId || session.user.tenantId !== stateData.tenantId) {
      return NextResponse.redirect(
        new URL("/parametres/integrations?error=session_mismatch", request.url)
      );
    }

    // Build redirect URI (must match the one used in connect)
    const redirectUri = new URL("/api/integrations/google/callback", request.url).toString();

    // Exchange code for tokens
    const tokens = await exchangeGoogleCode(code, redirectUri);

    // Get user email
    const email = await getGoogleUserEmail(tokens.access_token);

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Upsert integration
    await upsertIntegration(stateData.tenantId, {
      provider: "GOOGLE",
      accountEmail: email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiresAt,
    });

    // Success redirect
    return NextResponse.redirect(
      new URL("/parametres/integrations?connected=google", request.url)
    );
  } catch (error) {
    console.error("[Google Callback] Error:", error);
    return NextResponse.redirect(
      new URL("/parametres/integrations?error=callback_failed", request.url)
    );
  }
}
