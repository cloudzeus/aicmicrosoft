"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { FaSignOutAlt, FaTrash } from "react-icons/fa"

export function ClearSessionButton() {
  const handleClearSession = async () => {
    // Clear any cached session data
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    
    // Sign out and redirect to sign in
    await signOut({ 
      callbackUrl: "/auth/signin",
      redirect: true 
    })
  }

  return (
    <Button
      onClick={handleClearSession}
      variant="destructive"
      size="sm"
      className="flex items-center gap-2"
    >
      <FaTrash className="w-4 h-4" />
      CLEAR SESSION & SIGN OUT
    </Button>
  )
}






