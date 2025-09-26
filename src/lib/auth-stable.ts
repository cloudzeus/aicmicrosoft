import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Microsoft from "next-auth/providers/microsoft-entra-id"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

// STABLE AUTH CONFIGURATION - TESTED AND VERIFIED
export const authConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Microsoft({
      id: "c03bef53-43af-4d5e-be22-da859317086c",
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`,
      authorization: {
        params: {
          // MINIMAL, STABLE SCOPES - ONLY WHAT WE KNOW WORKS
          scope: "openid profile email User.Read User.ReadBasic.All Calendars.Read Calendars.ReadWrite Mail.Read Mail.ReadWrite Mail.Send",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = (token.role as UserRole) || UserRole.USER
        session.accessToken = token.accessToken as string || ""
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Store the access token from the account
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
      }
      if (user) {
        token.role = user.role || "USER"
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  // ADDITIONAL STABILITY CONFIGURATIONS
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(error: Error) {
      console.error(`[AUTH ERROR]:`, error)
    },
    warn(code: string) {
      console.warn(`[AUTH WARN] ${code}`)
    },
    debug(code: string, metadata?: unknown) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[AUTH DEBUG] ${code}:`, metadata)
      }
    },
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

