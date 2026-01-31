import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  generateGoogleState,
  getGoogleAuthUrl,
  isGoogleOAuthConfigured,
} from "@/lib/oauth/google";

export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    if (!isGoogleOAuthConfigured()) {
      return NextResponse.redirect(
        new URL("/parametres/integrations?error=not_configured", request.url)
      );
    }

    // Get session
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.redirect(
        new URL("/login?callbackUrl=/parametres/integrations", request.url)
      );
    }

    // Generate state with tenant ID
    const state = generateGoogleState(session.user.tenantId);

    // Build redirect URI (same origin)
    const redirectUri = new URL("/api/integrations/google/callback", request.url).toString();

    // Get Google auth URL and redirect
    const authUrl = getGoogleAuthUrl(state, redirectUri);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Google Connect] Error:", error);
    return NextResponse.redirect(
      new URL("/parametres/integrations?error=connection_failed", request.url)
    );
  }
}
