import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Database } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="Settings" 
      pageDescription="Configure your account and application preferences"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={session.user?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" defaultValue={session.user?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" defaultValue="User" disabled />
            </div>
            <Button className="w-full">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Meeting Reminders</Label>
                <p className="text-sm text-gray-500">Get reminded before meetings</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>File Sharing Alerts</Label>
                <p className="text-sm text-gray-500">Notify when files are shared</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Updates</Label>
                <p className="text-sm text-gray-500">Receive system maintenance notifications</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your security preferences and access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Two-Factor Authentication</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Enabled</Badge>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Session Timeout</Label>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue="30" className="w-20" />
                <span className="text-sm text-gray-500">minutes</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>API Access</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Active</Badge>
                <Button variant="outline" size="sm">View Keys</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>
              View system status and configuration details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Application Version</Label>
                <p className="font-medium">v1.2.0</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Last Updated</Label>
                <p className="font-medium">2 days ago</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Database Status</Label>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              <div>
                <Label className="text-sm text-gray-500">API Status</Label>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
            </div>
            <Separator />
            <Button variant="outline" className="w-full">
              Check for Updates
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
