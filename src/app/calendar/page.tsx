import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { FullCalendar } from "@/components/calendar/full-calendar"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function CalendarPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="Calendar" 
      pageDescription="Manage your Office 365 schedule and meetings"
    >
      <FullCalendar />
    </DashboardLayout>
  )
}
