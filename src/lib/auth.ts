import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Microsoft from "next-auth/providers/microsoft-entra-id"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

// Token refresh function
async function refreshAccessToken(token: {
  accessToken?: string
  refreshToken?: string
  expiresAt?: number
  [key: string]: unknown
}) {
  try {
    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken || "",
      }),
      method: "POST",
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000 + refreshedTokens.expires_in),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    }
  } catch (error) {
    console.log("Error refreshing access token", error)

    return {
      ...token,
      error: "RefreshAccessTokenError",
    }
  }
}

// STABLE AUTH CONFIGURATION
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
        if (token.error) {
          Object.assign(session, { error: token.error })
        }
      }
      return session
    },
    async jwt({ token, account }) {
      // Initial sign in
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        return token
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
