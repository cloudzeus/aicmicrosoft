"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { FaSignOutAlt } from "react-icons/fa"

export function SignOutButton() {
  return (
    <Button
      onClick={() => signOut({ callbackUrl: "/auth/signin" })}
      variant="outline"
      className="flex items-center gap-2"
    >
      <FaSignOutAlt className="w-4 h-4" />
      SIGN OUT
    </Button>
  )
}
