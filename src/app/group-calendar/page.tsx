import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { GroupCalendarWrapper } from "@/components/calendar/group-calendar-wrapper"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function GroupCalendarPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="Group Calendar" 
      pageDescription="View colleague availability and schedule meetings"
    >
      <GroupCalendarWrapper />
    </DashboardLayout>
  )
}
