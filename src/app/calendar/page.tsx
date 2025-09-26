import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { FullCalendar } from "@/components/calendar/full-calendar"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { ClearSessionButton } from "@/components/auth/clear-session-button"
import Link from "next/link"
import { FaHome, FaCalendarAlt } from "react-icons/fa"

export default async function CalendarPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <FaHome className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 text-gray-900">
              <FaCalendarAlt className="w-5 h-5" />
              <span className="font-medium">Calendar</span>
            </div>
          </div>
          <div className="flex gap-2">
            <ClearSessionButton />
            <SignOutButton />
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">CALENDAR</h1>
          <p className="text-gray-600">MANAGE YOUR OFFICE 365 SCHEDULE</p>
        </div>
        
        <FullCalendar />
      </div>
    </div>
  )
}
