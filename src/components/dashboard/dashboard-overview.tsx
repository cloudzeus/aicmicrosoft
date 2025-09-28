"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  Users, 
  Mail, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Activity,
  Clock,
  CheckCircle
} from "lucide-react"

// Mock data for demonstration
const recentActivities = [
  { id: 1, action: "New email received", user: "john.doe@company.com", time: "2 minutes ago", type: "email" },
  { id: 2, action: "Meeting scheduled", user: "jane.smith@company.com", time: "15 minutes ago", type: "calendar" },
  { id: 3, action: "Document shared", user: "mike.wilson@company.com", time: "1 hour ago", type: "file" },
  { id: 4, action: "User added to group", user: "sarah.jones@company.com", time: "2 hours ago", type: "user" },
  { id: 5, action: "Calendar event updated", user: "alex.brown@company.com", time: "3 hours ago", type: "calendar" },
]

const stats = [
  { title: "Total Users", value: "1,247", change: "+12%", icon: Users, color: "text-blue-600" },
  { title: "Emails Today", value: "342", change: "+8%", icon: Mail, color: "text-green-600" },
  { title: "Meetings Today", value: "28", change: "+5%", icon: Calendar, color: "text-purple-600" },
  { title: "Files Shared", value: "156", change: "+23%", icon: FileText, color: "text-orange-600" },
]

export function DashboardOverview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.change} from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest activities across your Microsoft 365 services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    {activity.type === "email" && <Mail className="h-4 w-4 text-blue-600" />}
                    {activity.type === "calendar" && <Calendar className="h-4 w-4 text-purple-600" />}
                    {activity.type === "file" && <FileText className="h-4 w-4 text-orange-600" />}
                    {activity.type === "user" && <Users className="h-4 w-4 text-green-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {activity.user}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                View All Activities
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              Current status of Microsoft 365 services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Exchange Online</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">SharePoint Online</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Teams</span>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">OneDrive</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800">Degraded</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts for your Microsoft 365 workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Mail className="h-6 w-6" />
              <span>Compose Email</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="h-6 w-6" />
              <span>Schedule Meeting</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="h-6 w-6" />
              <span>Upload File</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Add User</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
