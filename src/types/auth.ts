import { DefaultSession } from "next-auth"
import { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: UserRole
    } & DefaultSession["user"]
    accessToken?: string
    error?: string
  }

  interface User {
    role: UserRole
  }
}

