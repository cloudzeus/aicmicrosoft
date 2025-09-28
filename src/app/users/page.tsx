import { Suspense } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { UsersManagementClient } from "@/components/management/users-management-client"
import { getUsersWithAssignments } from "./actions"
import { Loader2 } from "lucide-react"

export default async function UsersManagementPage() {
  const { users, departments, success, error } = await getUsersWithAssignments()

  if (!success) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-2">Failed to load users</p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading users...</span>
        </div>
      }>
        <UsersManagementClient 
          initialUsers={users} 
          initialDepartments={departments} 
        />
      </Suspense>
    </AppLayout>
  )
}