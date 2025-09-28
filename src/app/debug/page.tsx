"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppLayout } from "@/components/layout/app-layout"
import { toast } from "sonner"
import { RefreshCw, User, Database, Shield } from "lucide-react"

interface DebugInfo {
  session: {
    user: {
      email?: string;
      name?: string;
    } | null
    role: string
    accessToken: boolean
  }
  database: {
    user: {
      email?: string;
      name?: string;
      role?: string;
      tenantId?: string;
    } | null
    found: boolean
  }
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDebugInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/user-role')
      if (response.ok) {
        const data = await response.json()
        setDebugInfo(data)
      } else {
        toast.error('Failed to fetch debug info')
      }
    } catch (error) {
      console.error('Error fetching debug info:', error)
      toast.error('Error fetching debug info')
    } finally {
      setLoading(false)
    }
  }

  const fixUserRole = async () => {
    try {
      const response = await fetch('/api/debug/fix-user-role', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        toast.success('User role fixed! Please refresh the page.')
        fetchDebugInfo()
      } else {
        toast.error('Failed to fix user role')
      }
    } catch (error) {
      console.error('Error fixing user role:', error)
      toast.error('Error fixing user role')
    }
  }

  const refreshSession = async () => {
    try {
      const response = await fetch('/api/debug/refresh-session', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        if (data.needsRefresh) {
          toast.info('Session needs refresh. Please sign out and sign in again.')
        } else {
          toast.success('Session is up to date')
        }
        fetchDebugInfo()
      } else {
        toast.error('Failed to check session')
      }
    } catch (error) {
      console.error('Error checking session:', error)
      toast.error('Error checking session')
    }
  }

  useEffect(() => {
    fetchDebugInfo()
  }, [])

  if (loading) {
    return (
      <AppLayout pageTitle="Debug" pageDescription="Debug user role and session">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-gray-400" />
            <p className="text-gray-500">Loading debug info...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout pageTitle="Debug" pageDescription="Debug user role and session">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Debug Information</h1>
          <Button onClick={fetchDebugInfo} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {debugInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Session Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Email:</label>
                  <p className="text-sm">{debugInfo.session.user?.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Name:</label>
                  <p className="text-sm">{debugInfo.session.user?.name || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Role:</label>
                  <Badge variant={debugInfo.session.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {debugInfo.session.role}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Access Token:</label>
                  <Badge variant={debugInfo.session.accessToken ? 'default' : 'destructive'}>
                    {debugInfo.session.accessToken ? 'Available' : 'Missing'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Database Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Database Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {debugInfo.database.found ? (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Email:</label>
                      <p className="text-sm">{debugInfo.database.user?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name:</label>
                      <p className="text-sm">{debugInfo.database.user?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Role:</label>
                      <Badge variant={debugInfo.database.user?.role === 'ADMIN' ? 'default' : 'secondary'}>
                        {debugInfo.database.user?.role}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Tenant ID:</label>
                      <p className="text-sm font-mono text-xs">{debugInfo.database.user?.tenantId || 'N/A'}</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">User not found in database</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={fixUserRole} className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Fix User Role (Set to ADMIN)
              </Button>
              <Button onClick={refreshSession} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Check Session Refresh
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Fix User Role:</strong> Creates or updates the user in the database with ADMIN role.</p>
              <p><strong>Check Session Refresh:</strong> Checks if the session needs to be refreshed to sync roles.</p>
              <p><strong>Note:</strong> After fixing the role, you may need to sign out and sign in again to see the changes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
