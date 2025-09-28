import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, RefreshCw, Trash2, Download, Upload, AlertTriangle } from "lucide-react"

export default async function DatabaseManagementPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  // Check if user is admin
  if (session.user?.role !== 'ADMIN') {
    redirect("/dashboard")
  }

  return (
    <DashboardLayout pageTitle="Database Tools">
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Database Tools</h1>
            <p className="text-gray-600 mt-1">Database management and maintenance tools</p>
          </div>
        </div>

        {/* Database Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Database Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium">Connected</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">MySQL via Prisma</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">37</div>
              <p className="text-xs text-gray-500">Across all tables</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-gray-500">Never</div>
              <p className="text-xs text-gray-400">No tenant sync yet</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Schema Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">Latest</div>
              <p className="text-xs text-gray-500">Prisma schema</p>
            </CardContent>
          </Card>
        </div>

        {/* Database Operations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Schema Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Schema Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Push Schema Changes</h4>
                  <p className="text-sm text-gray-500">Apply schema changes to database</p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Push
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Generate Client</h4>
                  <p className="text-sm text-gray-500">Update Prisma client</p>
                </div>
                <Button variant="outline" size="sm">
                  <Database className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Reset Database</h4>
                  <p className="text-sm text-gray-500">Drop and recreate all tables</p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Seed Database</h4>
                  <p className="text-sm text-gray-500">Populate with initial data</p>
                </div>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Seed
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Data</h4>
                  <p className="text-sm text-gray-500">Download database backup</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <h4 className="font-medium">Sync Status Check</h4>
                  <p className="text-sm text-gray-500">Verify sync status integrity</p>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Database Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Database Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  Users
                </h4>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-gray-500">1 local, 0 tenant sync</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-green-600" />
                  Departments
                </h4>
                <div className="text-2xl font-bold">7</div>
                <p className="text-xs text-gray-500">7 local, 0 tenant sync</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  Positions
                </h4>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-gray-500">15 local, 0 tenant sync</p>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-600" />
                  SharePoint Sites
                </h4>
                <div className="text-2xl font-bold">14</div>
                <p className="text-xs text-gray-500">14 local, 0 tenant sync</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              Important Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="text-amber-700">
            <ul className="space-y-2 text-sm">
              <li>• Always use <code className="bg-amber-100 px-1 rounded">prisma db push</code> instead of migrations</li>
              <li>• Database reset will delete all data permanently</li>
              <li>• Sync status fields are critical for tenant sync functionality</li>
              <li>• Local items can be deleted, tenant sync items cannot</li>
              <li>• Always backup data before major operations</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
