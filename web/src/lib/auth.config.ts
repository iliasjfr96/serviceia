import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as string;
        token.tenantId = (user as Record<string, unknown>).tenantId as
          | string
          | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | null;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const publicPaths = ["/login", "/register", "/forgot-password"];
      const apiAuthPaths = ["/api/auth"];
      const webhookPaths = ["/api/webhooks"];

      if (apiAuthPaths.some((p) => pathname.startsWith(p))) return true;
      if (webhookPaths.some((p) => pathname.startsWith(p))) return true;

      if (publicPaths.some((p) => pathname.startsWith(p))) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (
        pathname.startsWith("/admin") &&
        auth?.user?.role !== "SUPER_ADMIN"
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
};
