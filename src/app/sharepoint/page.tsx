import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SharePointBrowser } from "@/components/sharepoint/sharepoint-browser"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function SharePointPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="SharePoint" 
      pageDescription="Access and manage your SharePoint files and folders"
    >
      <SharePointBrowser />
    </DashboardLayout>
  )
}
