import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { FaUser, FaEnvelope, FaCalendarAlt, FaShieldAlt, FaBuilding, FaGlobe, FaUsers, FaShareAlt } from "react-icons/fa"
import { NewTeamsMeeting } from "@/components/calendar/new-teams-meeting"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard/dashboard-overview"
import { TodosList } from "@/components/dashboard/todos-list"
import { graphAPI } from "@/lib/microsoft-graph"

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Fetch additional user details from database
  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: {
      accounts: true,
    }
  })

  if (!user) {
    redirect("/auth/signin")
  }

  const microsoftAccount = user.accounts.find(account => account.provider === "c03bef53-43af-4d5e-be22-da859317086c")

  // Fetch groups and shared mailboxes via Graph (server-side)
  let myGroups: Array<{ id: string; displayName: string; mail?: string; mailEnabled?: boolean; groupTypes?: string[] }> = []
  let sharedMailboxes: Array<{ id: string; displayName: string; mail?: string }> = []
  let profileImageDataUrl: string | null = null
  let microsoftTodos: any[] = []
  try {
    myGroups = await graphAPI.getMyGroups()
    sharedMailboxes = await graphAPI.getSharedMailboxesIAmMember()
    profileImageDataUrl = await graphAPI.getMyProfilePhotoBase64()
    microsoftTodos = await graphAPI.getToDoTasks()
  } catch {
    // ignore errors to keep dashboard rendering
  }


  return (
    <DashboardLayout 
      pageTitle="Dashboard" 
      pageDescription="Welcome to your Microsoft 365 profile"
    >
      {/* Dashboard Overview */}
      <DashboardOverview />

      {/* User Profile and Details */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Todos List */}
        <TodosList userId={user.id} initialTodos={microsoftTodos} />
          {/* User Profile Card */}
          <Card className="border border-[#e5e7eb] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
                <FaUser className="w-4 h-4 text-[#5e5e5e]" />
                Profile
              </CardTitle>
              <CardDescription className="text-[12px]">Basic account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {(profileImageDataUrl || user.image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profileImageDataUrl || user.image || ''}
                    alt="Profile"
                    className="w-16 h-16 rounded-full ring-2 ring-[#c7d2fe] object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center text-lg font-semibold">
                    {(user.name || 'U').charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-[16px] text-[#111827]">{user.name || "NO NAME PROVIDED"}</h3>
                  <p className="text-[13px] text-[#61656a]">{user.email}</p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Role</span>
                <Badge className={`${user.role === "ADMIN" ? 'bg-[#dc2626]' : user.role === "MANAGER" ? 'bg-[#2563eb]' : 'bg-[#6b7280]'} text-white`}>{user.role}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Member since</span>
                <span className="text-[13px] font-medium text-[#111827]">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Microsoft 365 Details */}
          <Card className="border border-[#e5e7eb] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
                <FaBuilding className="w-4 h-4 text-[#5e5e5e]" />
                Microsoft 365
              </CardTitle>
              <CardDescription className="text-[12px]">Account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Provider</span>
                <Badge className="bg-[#4f46e5] text-white">Entra ID</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Account ID</span>
                <span className="text-[12px] font-mono text-[#111827]">
                  {microsoftAccount?.providerAccountId || "NOT AVAILABLE"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Token type</span>
                <span className="text-[13px] font-medium text-[#111827]">
                  {microsoftAccount?.token_type || "NOT AVAILABLE"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Scope</span>
                <span className="text-[11px] font-mono text-[#374151]">
                  {microsoftAccount?.scope || "NOT AVAILABLE"}
                </span>
              </div>
              {microsoftAccount?.expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6b7280]">Token expires</span>
                  <span className="text-[13px] font-medium text-[#111827]">
                    {new Date(microsoftAccount.expires_at * 1000).toLocaleString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Status */}
          <Card className="border border-[#e5e7eb] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
                <FaShieldAlt className="w-4 h-4 text-[#5e5e5e]" />
                Status
              </CardTitle>
              <CardDescription className="text-[12px]">Authentication & security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Email verified</span>
                {user.emailVerified ? (
                  <Badge className="bg-[#16a34a] text-white">Verified</Badge>
                ) : (
                  <Badge className="bg-[#dc2626] text-white">Not verified</Badge>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Authentication</span>
                <Badge className="bg-[#2563eb] text-white">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Last updated</span>
                <span className="text-[13px] font-medium text-[#111827]">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#6b7280]">Sessions</span>
                <span className="text-[13px] font-medium text-[#111827]">
                  {user.accounts.length} active
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Groups & Shared Mailboxes */}
          <Card className="border border-[#e5e7eb] shadow-sm md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-[#1f2328]">Groups & shared mailboxes</CardTitle>
              <CardDescription className="text-[12px]">Your memberships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h4 className="text-[13px] font-medium mb-2 text-[#111827]">Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {myGroups.length === 0 && (
                      <span className="text-[12px] text-[#6b7280]">No groups found</span>
                    )}
                    {myGroups.map((g) => (
                      <Badge key={g.id} className="bg-[#f3f4f6] text-[#111827] border border-[#e5e7eb]">{g.displayName}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[13px] font-medium mb-2 text-[#111827]">Shared mailboxes</h4>
                  <div className="flex flex-wrap gap-2">
                    {sharedMailboxes.length === 0 && (
                      <span className="text-[12px] text-[#6b7280]">No shared mailboxes</span>
                    )}
                    {sharedMailboxes.map((m) => (
                      <Badge key={m.id} className="bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]">{m.displayName}{m.mail ? ` (${m.mail})` : ''}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border border-[#e5e7eb] shadow-sm md:col-span-2 lg:col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-[15px] font-semibold text-[#1f2328]">Quick actions</CardTitle>
              <CardDescription className="text-[12px]">Available features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <FaEnvelope className="w-6 h-6" />
                  Manage profile
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <a href="/emails">
                    <FaEnvelope className="w-6 h-6" />
                    Email inbox
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <a href="/calendar">
                    <FaCalendarAlt className="w-6 h-6" />
                    My calendar
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <a href="/group-calendar">
                    <FaUsers className="w-6 h-6" />
                    Group calendar
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <a href="/sharepoint">
                    <FaShareAlt className="w-6 h-6" />
                    SharePoint
                  </a>
                </Button>
                <Button asChild variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <a href="/users">
                    <FaUsers className="w-6 h-6" />
                    Tenant Users
                  </a>
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2 hover:bg-[#eef2ff]">
                  <FaGlobe className="w-6 h-6" />
                  Office 365 Apps
                </Button>
                <NewTeamsMeeting />
              </div>
            </CardContent>
          </Card>
      </div>
    </DashboardLayout>
  )
}
