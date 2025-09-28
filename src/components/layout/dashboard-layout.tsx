"use client"

import { redirect } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { AppLayout } from "./app-layout"
import { Toaster } from "sonner"

interface DashboardLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  pageDescription?: string
}

export function DashboardLayout({ children, pageTitle, pageDescription }: DashboardLayoutProps) {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return // Still loading
    if (!session) {
      redirect("/auth/signin")
    }
  }, [session, status])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render anything if not authenticated (redirect will happen)
  if (!session) {
    return null
  }

  return (
    <>
      <AppLayout pageTitle={pageTitle} pageDescription={pageDescription}>
        {children}
      </AppLayout>
      <Toaster />
    </>
  )
}
