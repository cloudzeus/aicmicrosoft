"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/app-layout"
import { toast } from "sonner"
import { RefreshCw, Users, Building, Briefcase, UserCheck } from "lucide-react"

interface TestData {
  session: {
    email: string
    role: string
    hasAccessToken: boolean
  }
  data: {
    departments: {
      count: number
      sample: Array<{
        id: string;
        name: string;
        code: string;
        _count: {
          userDepartments: number;
          positions: number;
        };
      }>
    }
    positions: {
      count: number
      sample: Array<{
        id: string;
        name: string;
        _count: {
          userPositions: number;
        };
      }>
    }
    users: {
      count: number
      sample: Array<{
        id: string;
        name: string | null;
        email: string;
        role: string;
      }>
    }
    assignments: {
      userDepartments: number
      userPositions: number
    }
  }
}

export default function TestDataPage() {
  const [testData, setTestData] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTestData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/test-data')
      if (response.ok) {
        const data = await response.json()
        setTestData(data)
      } else {
        const error = await response.json()
        toast.error(`Failed to fetch test data: ${error.error}`)
      }
    } catch (error) {
      console.error('Error fetching test data:', error)
      toast.error('Error fetching test data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTestData()
  }, [])

  if (loading) {
    return (
      <AppLayout pageTitle="Test Data" pageDescription="Check what data exists in the database">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-500">Loading test data...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout pageTitle="Test Data" pageDescription="Check what data exists in the database">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Database Test</h1>
          <Button onClick={fetchTestData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {testData && (
          <>
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email:</label>
                    <p className="text-sm">{testData.session.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Role:</label>
                    <Badge variant={testData.session.role === 'ADMIN' ? 'default' : 'secondary'}>
                      {testData.session.role}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Access Token:</label>
                    <Badge variant={testData.session.hasAccessToken ? 'default' : 'destructive'}>
                      {testData.session.hasAccessToken ? 'Available' : 'Missing'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Departments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{testData.data.departments.count}</div>
                  <p className="text-xs text-gray-500">Total departments</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Positions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{testData.data.positions.count}</div>
                  <p className="text-xs text-gray-500">Total positions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{testData.data.users.count}</div>
                  <p className="text-xs text-gray-500">Total users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {testData.data.assignments.userDepartments + testData.data.assignments.userPositions}
                  </div>
                  <p className="text-xs text-gray-500">
                    {testData.data.assignments.userDepartments} dept + {testData.data.assignments.userPositions} pos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sample Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sample Departments</CardTitle>
                </CardHeader>
                <CardContent>
                  {testData.data.departments.sample.length > 0 ? (
                    <div className="space-y-2">
                      {testData.data.departments.sample.map((dept) => (
                        <div key={dept.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="font-medium">{dept.name}</div>
                          <div className="text-gray-500">{dept.code}</div>
                          <div className="text-gray-400">
                            {dept._count.userDepartments} users, {dept._count.positions} positions
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No departments found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sample Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  {testData.data.positions.sample.length > 0 ? (
                    <div className="space-y-2">
                      {testData.data.positions.sample.map((pos) => (
                        <div key={pos.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="font-medium">{pos.name}</div>
                          <div className="text-gray-500">{pos._count.userPositions} users</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No positions found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Sample Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {testData.data.users.sample.length > 0 ? (
                    <div className="space-y-2">
                      {testData.data.users.sample.map((user) => (
                        <div key={user.id} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="font-medium">{user.name || user.email}</div>
                          <div className="text-gray-500">{user.role}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">No users found</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
