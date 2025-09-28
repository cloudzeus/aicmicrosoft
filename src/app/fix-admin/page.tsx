"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/app-layout"
import { toast } from "sonner"
import { Shield, RefreshCw, CheckCircle } from "lucide-react"

export default function FixAdminPage() {
  const [loading, setLoading] = useState(false)
  const [fixed, setFixed] = useState(false)

  const fixAdminRole = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/fix-admin', { method: 'POST' })
      
      if (response.ok) {
        const data = await response.json()
        setFixed(true)
        toast.success('Admin role fixed! Please sign out and sign in again.')
      } else {
        const error = await response.json()
        toast.error(`Failed to fix admin role: ${error.error}`)
      }
    } catch (error) {
      console.error('Error fixing admin role:', error)
      toast.error('Error fixing admin role')
    } finally {
      setLoading(false)
    }
  }

  const forceAdminRole = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/force-admin', { method: 'POST' })
      
      if (response.ok) {
        const data = await response.json()
        setFixed(true)
        toast.success('Admin role force updated! Please refresh the page.')
        // Refresh the page after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const error = await response.json()
        toast.error(`Failed to force update admin role: ${error.error}`)
      }
    } catch (error) {
      console.error('Error force updating admin role:', error)
      toast.error('Error force updating admin role')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout pageTitle="Fix Admin Role" pageDescription="Fix your user role to ADMIN">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Fix Admin Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!fixed ? (
              <>
                <p className="text-gray-600">
                  This will fix your user role to ADMIN in the database. After clicking the button below, 
                  you will need to sign out and sign in again to refresh your session.
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={fixAdminRole} 
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Fixing...
                      </>
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        Fix Admin Role
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={forceAdminRole} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Force Updating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Force Update (Refresh Page)
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <h3 className="text-lg font-semibold text-green-700 mb-2">Role Fixed!</h3>
                <p className="text-gray-600 mb-4">
                  Your role has been set to ADMIN. Please sign out and sign in again to see the changes.
                </p>
                <Button 
                  onClick={() => window.location.href = '/auth/signout'}
                  className="w-full"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What this does:</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• Updates your user record in the database with ADMIN role</p>
            <p>• Sets your tenant ID and sync status</p>
            <p>• Ensures you have access to all management features</p>
            <p>• Fixes the issue where you see USER instead of ADMIN</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
