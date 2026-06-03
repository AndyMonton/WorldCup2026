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
      
      const protectedPaths = ["/dashboard", "/predictions", "/ranking", "/rules", "/admin"];
      const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + "/"));

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        const userRole = (auth.user as any)?.role;
        if (userRole !== "ADMIN") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (isProtected) {
        if (isLoggedIn) return true;
        return false; // Redirigir a login
      }

      if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // Configurado en auth.ts
} satisfies NextAuthConfig;
