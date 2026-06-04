import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isOnAdmin = pathname.startsWith("/admin");
      
      console.log(`[Middleware Check] Path: ${pathname}, isLoggedIn: ${isLoggedIn}, user:`, auth?.user);
      
      const protectedPaths = ["/dashboard", "/predictions", "/ranking", "/rules", "/admin"];
      const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + "/"));

      if (isOnAdmin) {
        if (!isLoggedIn) {
          console.log(`[Middleware Redirect] Admin path ${pathname} not logged in, redirecting to login`);
          return false;
        }
        const userRole = (auth.user as any)?.role;
        console.log(`[Middleware Admin Check] userRole: ${userRole}`);
        if (userRole !== "ADMIN") {
          console.log(`[Middleware Redirect] User is not ADMIN, redirecting from ${pathname} to /dashboard`);
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (isProtected) {
        if (isLoggedIn) {
          console.log(`[Middleware Access] Allowed access to protected path ${pathname}`);
          return true;
        }
        console.log(`[Middleware Redirect] Protected path ${pathname} not logged in, redirecting to login`);
        return false; // Redirigir a login
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        console.log(`[Middleware Redirect] Logged in user on ${pathname}, redirecting to /dashboard`);
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "USER";
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  providers: [], // Configurado en auth.ts
} satisfies NextAuthConfig;
