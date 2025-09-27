import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { TenantUsersList } from "@/components/users/tenant-users-list"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function UsersPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[24px] font-semibold text-[#1f2328]">TENANT USERS</h1>
              <p className="text-[13px] text-[#61656a]">Manage and view all tenant users and domains</p>
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Users List Component */}
        <TenantUsersList />
      </div>
    </div>
  )
}
