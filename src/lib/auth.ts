import NextAuth from "next-auth"
import { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Microsoft from "next-auth/providers/microsoft-entra-id"
import { prisma } from "./prisma"
import { UserRole } from "@prisma/client"

// Validate critical env vars early to surface configuration issues clearly
const requiredEnvVars = [
  "AUTH_MICROSOFT_ENTRA_ID_ID",
  "AUTH_MICROSOFT_ENTRA_ID_SECRET",
  "TENANT_ID",
]

for (const key of requiredEnvVars) {
  if (!process.env[key] || String(process.env[key]).trim() === "") {
    console.warn(`[auth] Missing required env var: ${key}. Provider may fail at runtime.`)
  }
}

console.log('[auth] Runtime envs:', {
  AUTH_URL: process.env.AUTH_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
  NODE_ENV: process.env.NODE_ENV,
})

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
  trustHost: process.env.AUTH_TRUST_HOST === 'true',
  providers: [
    Microsoft({
      // Use client ID as provider id to match existing Azure redirect URIs
      id: "c03bef53-43af-4d5e-be22-da859317086c",
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      issuer: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0`,
      authorization: {
        params: {
          scope: "openid profile email offline_access User.Read User.ReadBasic.All Calendars.Read Calendars.ReadWrite Mail.Read Mail.ReadWrite Mail.Send",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn callback:', {
        userEmail: user?.email,
        provider: account?.provider,
        hasAccount: !!account,
        hasProfile: !!profile
      })
      
      // Temporarily simplified to avoid account linking issues
      return true
    },
    async jwt({ token, account, user, trigger }) {
      // Initial sign in
      if (account && user) {
        // Store only essential token data to reduce JWT size
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        
        // Get user role from database to preserve admin status
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { role: true }
          })
          token.role = dbUser?.role || UserRole.USER
          console.log(`JWT: User ${user.email} has role ${token.role}`)
        } catch (error) {
          console.error('Error fetching user role:', error)
          token.role = UserRole.USER
        }
        
        return token
      }

      // Always check database role on every JWT call to ensure it's up to date
      if (token.email) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: { role: true }
          })
          
          console.log(`JWT: Checking role for ${token.email}:`, {
            currentTokenRole: token.role,
            databaseRole: dbUser?.role,
            userFound: !!dbUser
          })
          
          // Update token role if database role is different
          if (dbUser && token.role !== dbUser.role) {
            console.log(`JWT: Updating role from ${token.role} to ${dbUser.role} for ${token.email}`)
            token.role = dbUser.role
          }
        } catch (error) {
          console.error('Error checking user role in JWT:', error)
        }
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < (token.expiresAt as number) * 1000) {
        return token
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token)
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub!
        session.user.role = (token.role as UserRole) || UserRole.USER
        // Don't store accessToken in session to avoid cookie size limit
        // Access token will be fetched from database when needed
        if (token.error) {
          Object.assign(session, { error: token.error })
        }
        console.log(`Session: User ${session.user.email} has role ${session.user.role}`)
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
