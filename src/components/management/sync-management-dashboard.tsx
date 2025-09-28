"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  FaUsers, 
  FaBuilding, 
  FaBriefcase, 
  FaShareAlt,
  FaSync,
  FaTrash,
  FaSearch,
  FaCloud,
  FaDatabase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle
} from "react-icons/fa"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SyncStatusData {
  local: {
    users: Array<{
      id: string;
      name: string | null;
      email: string;
      role: string;
      isFromTenantSync: boolean;
    }>
    departments: Array<{
      id: string;
      name: string;
      code: string;
      description: string | null;
    }>
    positions: Array<{
      id: string;
      name: string;
      description: string | null;
    }>
    sharePoints: Array<{
      id: string;
      displayName: string;
      url: string;
      accessLevel: string;
    }>
  }
  tenant?: {
    users?: Array<{
      id: string;
      displayName: string;
      mail: string;
    }>
    departments?: Array<{
      id: string;
      displayName: string;
    }>
  }
  statistics: {
    users: { total: number; fromTenantSync: number; local: number }
    departments: { total: number; fromTenantSync: number; local: number }
    positions: { total: number; fromTenantSync: number; local: number }
    sharePoints: { total: number; fromTenantSync: number; local: number }
  }
}

interface DeleteResults {
  deleted: string[]
  skipped: string[]
  errors: { id: string; error: string }[]
  summary: {
    totalRequested: number
    deleted: number
    skipped: number
    errors: number
  }
}

export function SyncManagementDashboard() {
  const [data, setData] = useState<SyncStatusData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: boolean }>({})
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteResults, setDeleteResults] = useState<DeleteResults | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Fetch sync status data
  const fetchSyncStatus = useCallback(async (includeTenantData = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/management/sync-status?includeTenantData=${includeTenantData}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch sync status')
      }
    } catch (err) {
      setError('Failed to fetch sync status')
      console.error('Error fetching sync status:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSyncStatus(true) // Load tenant data by default
  }, [fetchSyncStatus])

  // Handle item selection
  const handleItemSelect = (id: string, checked: boolean) => {
    setSelectedItems(prev => ({
      ...prev,
      [id]: checked
    }))
  }

  // Select all local items
  const selectAllLocal = (type: string) => {
    if (!data) return
    
    const items = data.local[type as keyof typeof data.local] as Array<{ id: string; isFromTenantSync?: boolean }>
    const localItems = items.filter(item => !item.isFromTenantSync)
    
    const newSelection = { ...selectedItems }
    localItems.forEach(item => {
      newSelection[item.id] = true
    })
    setSelectedItems(newSelection)
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedItems({})
  }

  // Sync from tenant
  const syncFromTenant = async () => {
    try {
      setSyncing(true)
      setError(null)
      
      const response = await fetch('/api/management/sync-from-tenant', {
        method: 'POST',
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('Sync completed:', result)
        // Refresh the data after successful sync
        await fetchSyncStatus(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to sync from tenant')
      }
    } catch (err) {
      setError('Failed to sync from tenant')
      console.error('Error syncing from tenant:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Get selected items by type
  const getSelectedItemsByType = (type: string) => {
    if (!data) return []
    
    const items = data.local[type as keyof typeof data.local] as Array<{ id: string; isFromTenantSync?: boolean }>
    return items.filter(item => selectedItems[item.id] && !item.isFromTenantSync)
  }

  // Delete selected items
  const handleDelete = async (type: string) => {
    const itemsToDelete = getSelectedItemsByType(type)
    if (itemsToDelete.length === 0) return

    try {
      setDeleting(true)
      
      const response = await fetch('/api/management/delete-local', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          type,
          ids: itemsToDelete.map(item => item.id)
        })
      })

      if (response.ok) {
        const result = await response.json()
        setDeleteResults(result.results)
        setDeleteDialogOpen(true)
        
        // Refresh data
        await fetchSyncStatus()
        clearSelection()
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to delete items')
      }
    } catch (err) {
      setError('Failed to delete items')
      console.error('Error deleting items:', err)
    } finally {
      setDeleting(false)
    }
  }

  // Filter items by search term
  const filterItems = (items: Array<{ name?: string; email?: string; displayName?: string; code?: string }>) => {
    if (!searchTerm) return items
    
    const term = searchTerm.toLowerCase()
    return items.filter(item => 
      item.name?.toLowerCase().includes(term) ||
      item.displayName?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.code?.toLowerCase().includes(term)
    )
  }

  // Render sync status badge
  const renderSyncBadge = (isFromTenantSync: boolean) => {
    if (isFromTenantSync) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <FaCloud className="w-3 h-3 mr-1" />
          Office 365
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
        <FaDatabase className="w-3 h-3 mr-1" />
        Local
      </Badge>
    )
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <FaSync className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading sync status...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="mb-4">
          <FaExclamationTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Error:</strong> {error}</p>
              <p className="text-sm text-gray-600">
                This could be due to:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside ml-4 space-y-1">
                <li>Expired Microsoft authentication token</li>
                <li>Insufficient permissions to access Office 365 data</li>
                <li>Network connectivity issues</li>
                <li>Microsoft Graph API service issues</li>
              </ul>
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={() => fetchSyncStatus(true)}
                  variant="outline"
                  size="sm"
                >
                  <FaSync className="mr-2 h-4 w-4" />
                  Retry with Tenant Data
                </Button>
                <Button 
                  onClick={() => fetchSyncStatus(false)}
                  variant="outline"
                  size="sm"
                >
                  Load Local Data Only
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sync Management Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage items synced from Office 365 vs locally created</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={syncFromTenant} 
            variant="default" 
            size="sm"
            disabled={syncing}
          >
            <FaSync className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Tenant'}
          </Button>
          <Button onClick={() => fetchSyncStatus(true)} variant="outline" size="sm">
            <FaSync className="w-4 h-4 mr-2" />
            Refresh with Tenant Data
          </Button>
          <Button onClick={() => fetchSyncStatus(false)} variant="outline" size="sm">
            <FaSync className="w-4 h-4 mr-2" />
            Refresh Local Only
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.users.total}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FaCloud className="w-3 h-3 text-green-600" />
                {data.statistics.users.fromTenantSync} Office 365
              </span>
              <span className="flex items-center gap-1">
                <FaDatabase className="w-3 h-3 text-gray-600" />
                {data.statistics.users.local} Local
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.departments.total}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FaCloud className="w-3 h-3 text-green-600" />
                {data.statistics.departments.fromTenantSync} Office 365
              </span>
              <span className="flex items-center gap-1">
                <FaDatabase className="w-3 h-3 text-gray-600" />
                {data.statistics.departments.local} Local
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.positions.total}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FaCloud className="w-3 h-3 text-green-600" />
                {data.statistics.positions.fromTenantSync} Office 365
              </span>
              <span className="flex items-center gap-1">
                <FaDatabase className="w-3 h-3 text-gray-600" />
                {data.statistics.positions.local} Local
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">SharePoint Sites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.sharePoints.total}</div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <FaCloud className="w-3 h-3 text-green-600" />
                {data.statistics.sharePoints.fromTenantSync} Office 365
              </span>
              <span className="flex items-center gap-1">
                <FaDatabase className="w-3 h-3 text-gray-600" />
                {data.statistics.sharePoints.local} Local
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={clearSelection} variant="outline" size="sm" disabled={Object.keys(selectedItems).length === 0}>
            Clear Selection
          </Button>
        </div>
      </div>

      {/* Tabs for different item types */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <FaUsers className="w-4 h-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <FaBuilding className="w-4 h-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-2">
            <FaBriefcase className="w-4 h-4" />
            Positions
          </TabsTrigger>
          <TabsTrigger value="sharepoints" className="flex items-center gap-2">
            <FaShareAlt className="w-4 h-4" />
            SharePoint
          </TabsTrigger>
          <TabsTrigger value="tenant" className="flex items-center gap-2">
            <FaCloud className="w-4 h-4" />
            Tenant Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Users</h3>
            <div className="flex gap-2">
              <Button onClick={() => selectAllLocal('users')} variant="outline" size="sm">
                Select All Local
              </Button>
              <Button 
                onClick={() => handleDelete('user')} 
                variant="destructive" 
                size="sm"
                disabled={getSelectedItemsByType('users').length === 0 || deleting}
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Selected ({getSelectedItemsByType('users').length})
              </Button>
            </div>
          </div>
          
          <div className="grid gap-3">
            {filterItems(data.local.users).map((user) => (
              <Card key={user.id} className={`${selectedItems[user.id] ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems[user.id] || false}
                        onCheckedChange={(checked) => handleItemSelect(user.id, !!checked)}
                        disabled={user.isFromTenantSync}
                      />
                      <div>
                        <div className="font-medium">{user.name || user.email}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        {user.jobTitle && (
                          <div className="text-sm text-gray-400">{user.jobTitle}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSyncBadge(user.isFromTenantSync)}
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Departments</h3>
            <div className="flex gap-2">
              <Button onClick={() => selectAllLocal('departments')} variant="outline" size="sm">
                Select All Local
              </Button>
              <Button 
                onClick={() => handleDelete('department')} 
                variant="destructive" 
                size="sm"
                disabled={getSelectedItemsByType('departments').length === 0 || deleting}
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Selected ({getSelectedItemsByType('departments').length})
              </Button>
            </div>
          </div>
          
          <div className="grid gap-3">
            {filterItems(data.local.departments).map((department) => (
              <Card key={department.id} className={`${selectedItems[department.id] ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems[department.id] || false}
                        onCheckedChange={(checked) => handleItemSelect(department.id, !!checked)}
                        disabled={department.isFromTenantSync}
                      />
                      <div>
                        <div className="font-medium">{department.name}</div>
                        <div className="text-sm text-gray-500">{department.code}</div>
                        {department.description && (
                          <div className="text-sm text-gray-400">{department.description}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {department._count.userDepartments} users, {department._count.positions} positions, {department._count.sharePoints} sites
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSyncBadge(department.isFromTenantSync)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Positions</h3>
            <div className="flex gap-2">
              <Button onClick={() => selectAllLocal('positions')} variant="outline" size="sm">
                Select All Local
              </Button>
              <Button 
                onClick={() => handleDelete('position')} 
                variant="destructive" 
                size="sm"
                disabled={getSelectedItemsByType('positions').length === 0 || deleting}
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Selected ({getSelectedItemsByType('positions').length})
              </Button>
            </div>
          </div>
          
          <div className="grid gap-3">
            {filterItems(data.local.positions).map((position) => (
              <Card key={position.id} className={`${selectedItems[position.id] ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems[position.id] || false}
                        onCheckedChange={(checked) => handleItemSelect(position.id, !!checked)}
                        disabled={position.isFromTenantSync}
                      />
                      <div>
                        <div className="font-medium">{position.name}</div>
                        <div className="text-sm text-gray-500">{position.department.name} ({position.department.code})</div>
                        {position.description && (
                          <div className="text-sm text-gray-400">{position.description}</div>
                        )}
                        <div className="text-xs text-gray-400">
                          {position._count.userPositions} users assigned
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSyncBadge(position.isFromTenantSync)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sharepoints" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">SharePoint Sites</h3>
            <div className="flex gap-2">
              <Button onClick={() => selectAllLocal('sharePoints')} variant="outline" size="sm">
                Select All Local
              </Button>
              <Button 
                onClick={() => handleDelete('sharepoint')} 
                variant="destructive" 
                size="sm"
                disabled={getSelectedItemsByType('sharePoints').length === 0 || deleting}
              >
                <FaTrash className="w-4 h-4 mr-2" />
                Delete Selected ({getSelectedItemsByType('sharePoints').length})
              </Button>
            </div>
          </div>
          
          <div className="grid gap-3">
            {filterItems(data.local.sharePoints).map((sharePoint) => (
              <Card key={sharePoint.id} className={`${selectedItems[sharePoint.id] ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItems[sharePoint.id] || false}
                        onCheckedChange={(checked) => handleItemSelect(sharePoint.id, !!checked)}
                        disabled={sharePoint.isFromTenantSync}
                      />
                      <div>
                        <div className="font-medium">{sharePoint.displayName}</div>
                        <div className="text-sm text-gray-500">{sharePoint.department.name} ({sharePoint.department.code})</div>
                        <div className="text-sm text-gray-400">{sharePoint.siteUrl}</div>
                        <div className="text-xs text-gray-400">
                          Access Level: {sharePoint.accessLevel}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderSyncBadge(sharePoint.isFromTenantSync)}
                      <Badge variant="outline">{sharePoint.accessLevel}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tenant" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Tenant Data from Microsoft Graph</h3>
            <div className="flex gap-2">
              <Button onClick={() => fetchSyncStatus(true)} variant="outline" size="sm">
                <FaSync className="w-4 h-4 mr-2" />
                Refresh Tenant Data
              </Button>
            </div>
          </div>

          {data.tenant ? (
            <div className="space-y-6">
              {/* Tenant Users */}
              {data.tenant.users && data.tenant.users.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FaUsers className="w-4 h-4" />
                    Tenant Users ({data.tenant.users.length})
                  </h4>
                  <div className="grid gap-3">
                    {data.tenant.users.slice(0, 10).map((user: { displayName?: string; mail?: string; userPrincipalName?: string; jobTitle?: string }, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.displayName || 'Unknown'}</p>
                            <p className="text-sm text-gray-600">{user.mail || user.userPrincipalName}</p>
                            <p className="text-xs text-gray-500">{user.jobTitle || 'No job title'}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <FaCloud className="w-3 h-3 mr-1" />
                            Office 365
                          </Badge>
                        </div>
                      </Card>
                    ))}
                    {data.tenant.users.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {data.tenant.users.length - 10} more users
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Tenant SharePoint Sites */}
              {data.tenant.sharePointSites && data.tenant.sharePointSites.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <FaShareAlt className="w-4 h-4" />
                    Tenant SharePoint Sites ({data.tenant.sharePointSites.length})
                  </h4>
                  <div className="grid gap-3">
                    {data.tenant.sharePointSites.slice(0, 10).map((site: { displayName?: string; webUrl?: string }, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{site.displayName || 'Unknown Site'}</p>
                            <p className="text-sm text-gray-600">{site.webUrl}</p>
                            {site.description && (
                              <p className="text-xs text-gray-500">{site.description}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <FaCloud className="w-3 h-3 mr-1" />
                            Office 365
                          </Badge>
                        </div>
                      </Card>
                    ))}
                    {data.tenant.sharePointSites.length > 10 && (
                      <p className="text-sm text-gray-500 text-center">
                        ... and {data.tenant.sharePointSites.length - 10} more sites
                      </p>
                    )}
                  </div>
                </div>
              )}

              {(!data.tenant.users || data.tenant.users.length === 0) && 
               (!data.tenant.sharePointSites || data.tenant.sharePointSites.length === 0) && (
                <Alert>
                  <FaExclamationTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No tenant data available. This could be due to:
                    <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                      <li>Expired authentication token</li>
                      <li>Insufficient permissions</li>
                      <li>No data in your Office 365 tenant</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {data.tenant.error && (
                <Alert variant="destructive">
                  <FaExclamationTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Error fetching tenant data: {data.tenant.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <FaExclamationTriangle className="h-4 w-4" />
              <AlertDescription>
                Tenant data not loaded. Click &quot;Refresh with Tenant Data&quot; to load data from Microsoft Graph.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Results Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Results</DialogTitle>
          </DialogHeader>
          {deleteResults && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="w-4 h-4 text-green-600" />
                  <span>Deleted: {deleteResults.summary.deleted}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaTimesCircle className="w-4 h-4 text-gray-600" />
                  <span>Skipped: {deleteResults.summary.skipped}</span>
                </div>
              </div>
              
              {deleteResults.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-600 mb-2">Errors:</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {deleteResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDeleteDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
