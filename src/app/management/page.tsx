import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { SyncManagementDashboard } from "@/components/management/sync-management-dashboard"

export default async function ManagementPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Check if user is admin
  if (session.user?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout pageTitle="Management">
      <SyncManagementDashboard />
    </DashboardLayout>
  )
}
