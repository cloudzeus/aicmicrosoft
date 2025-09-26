import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { GroupCalendarWrapper } from "@/components/calendar/group-calendar-wrapper"
import { SignOutButton } from "@/components/auth/sign-out-button"
import Link from "next/link"
import { FaHome, FaCalendarAlt, FaUsers } from "react-icons/fa"

export default async function GroupCalendarPage() {
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
            <Link href="/calendar" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <FaCalendarAlt className="w-5 h-5" />
              <span className="font-medium">My Calendar</span>
            </Link>
            <div className="flex items-center gap-2 text-gray-900">
              <FaUsers className="w-5 h-5" />
              <span className="font-medium">Group Calendar</span>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GROUP CALENDAR</h1>
          <p className="text-gray-600">VIEW COLLEAGUE AVAILABILITY AND SCHEDULE MEETINGS</p>
        </div>
        
        <GroupCalendarWrapper />
      </div>
    </div>
  )
}
