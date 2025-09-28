import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { TenantUsersList } from "@/components/users/tenant-users-list"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function UsersPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="Users" 
      pageDescription="Manage and view all tenant users and domains"
    >
      <TenantUsersList />
    </DashboardLayout>
  )
}
