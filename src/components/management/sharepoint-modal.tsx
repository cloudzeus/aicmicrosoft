"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Trash2, Plus, Loader2, ExternalLink, FolderOpen, Check, ChevronsUpDown, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DepartmentSharePoint {
  id: string
  siteId: string
  siteUrl: string
  displayName: string
  accessLevel: string
  isFromTenantSync: boolean
}

interface SharePointSite {
  id: string
  displayName: string
  webUrl: string
  name: string
  description?: string
}

interface SharePointModalProps {
  isOpen: boolean
  onClose: () => void
  departmentId: string
  departmentName: string
  sharePoints: DepartmentSharePoint[]
  onSuccess: () => void
}

export function SharePointModal({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  sharePoints,
  onSuccess
}: SharePointModalProps) {
  const [availableSites, setAvailableSites] = useState<SharePointSite[]>([])
  const [isLoadingSites, setIsLoadingSites] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SharePointSite | null>(null)
  const [isSiteComboOpen, setIsSiteComboOpen] = useState(false)
  const [newSharePoint, setNewSharePoint] = useState({
    accessLevel: "READ"
  })

  // Fetch available SharePoint sites when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableSites()
      // Clear any previously selected site when modal opens
      setSelectedSite(null)
    }
  }, [isOpen])

  const fetchAvailableSites = async () => {
    setIsLoadingSites(true)
    try {
      const response = await fetch('/api/sharepoint/sites')
      if (response.ok) {
        const data = await response.json()
        console.log('SharePoint sites fetched:', data.sites?.length || 0, 'sites')
        console.log('Sample site:', data.sites?.[0])
        setAvailableSites(data.sites || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch SharePoint sites:', errorData)
        
        if (errorData.error?.includes('expired') || errorData.error?.includes('token')) {
          toast.error('Microsoft authentication expired. Please sign out and sign in again.')
        } else {
          toast.error('Failed to fetch SharePoint sites from your tenant')
        }
        setAvailableSites([])
      }
    } catch (error) {
      console.error('Error fetching SharePoint sites:', error)
      toast.error('Failed to fetch SharePoint sites from your tenant')
      setAvailableSites([])
    } finally {
      setIsLoadingSites(false)
    }
  }

  const handleAddSharePoint = async () => {
    if (!selectedSite) {
      toast.error("Please select a SharePoint site")
      return
    }

    setIsAdding(true)

    try {
      const response = await fetch(`/api/departments/${departmentId}/sharepoints`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: selectedSite.id,
          siteUrl: selectedSite.webUrl,
          displayName: selectedSite.displayName,
          accessLevel: newSharePoint.accessLevel
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to add SharePoint site")
      }

      toast.success("SharePoint site added successfully")
      setSelectedSite(null)
      setNewSharePoint({
        accessLevel: "READ"
      })
      onSuccess()
    } catch (error) {
      console.error("Error adding SharePoint site:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add SharePoint site")
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteSharePoint = async (sharePointId: string) => {
    if (!confirm("Are you sure you want to delete this SharePoint site?")) {
      return
    }

    setIsDeleting(sharePointId)

    try {
      const response = await fetch(`/api/departments/${departmentId}/sharepoints/${sharePointId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete SharePoint site")
      }

      toast.success("SharePoint site deleted successfully")
      onSuccess()
    } catch (error) {
      console.error("Error deleting SharePoint site:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete SharePoint site")
    } finally {
      setIsDeleting(null)
    }
  }

  const accessLevelLabels = {
    READ: "Read",
    CONTRIBUTE: "Contribute", 
    OWNER: "Owner"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            SharePoint Sites - {departmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current SharePoint Sites */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current SharePoint Sites</h3>
            {sharePoints.length > 0 ? (
              <div className="space-y-2">
                {sharePoints.map((sharePoint) => (
                  <div key={sharePoint.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{sharePoint.displayName}</h4>
                        <Badge variant={sharePoint.isFromTenantSync ? "default" : "secondary"} className="text-xs">
                          {sharePoint.isFromTenantSync ? "Office 365" : "Local"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {accessLevelLabels[sharePoint.accessLevel as keyof typeof accessLevelLabels]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{sharePoint.siteUrl}</p>
                      <p className="text-xs text-gray-500">Site ID: {sharePoint.siteId}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(sharePoint.siteUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {!sharePoint.isFromTenantSync && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSharePoint(sharePoint.id)}
                          disabled={isDeleting === sharePoint.id}
                        >
                          {isDeleting === sharePoint.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No SharePoint sites configured for this department</p>
            )}
          </div>

          {/* Add New SharePoint Site */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium">Add New SharePoint Site</h3>
            
            {/* SharePoint Site Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select SharePoint Site *</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAvailableSites}
                  disabled={isLoadingSites}
                  className="flex items-center gap-1"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingSites ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              <Popover open={isSiteComboOpen} onOpenChange={setIsSiteComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isSiteComboOpen}
                    className="w-full justify-between"
                    disabled={isLoadingSites}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {selectedSite ? selectedSite.displayName : "Select a SharePoint site..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search SharePoint sites..." />
                    <CommandEmpty>
                      {isLoadingSites ? "Loading sites from your Microsoft tenant..." : "No SharePoint sites available. Check your authentication or try refreshing."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {availableSites
                        .filter(site => !sharePoints.some(sp => sp.siteId === site.id))
                        .map((site) => (
                          <CommandItem
                            key={site.id}
                            value={`${site.displayName} ${site.webUrl} ${site.name}`}
                            onSelect={() => {
                              setSelectedSite(site)
                              setIsSiteComboOpen(false)
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedSite?.id === site.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{site.displayName}</span>
                              <span className="text-sm text-gray-500">{site.webUrl}</span>
                              {site.description && (
                                <span className="text-xs text-gray-400">{site.description}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Selected Site Display */}
            {selectedSite && (
              <div className="p-3 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedSite.displayName}</h4>
                    <p className="text-sm text-gray-600">{selectedSite.webUrl}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedSite.webUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Access Level Selector */}
            <div className="space-y-2">
              <Label htmlFor="accessLevel">Access Level</Label>
              <Select
                value={newSharePoint.accessLevel}
                onValueChange={(value) => setNewSharePoint(prev => ({ ...prev, accessLevel: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="READ">Read</SelectItem>
                  <SelectItem value="CONTRIBUTE">Contribute</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {availableSites.length === 0 && !isLoadingSites && (
              <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>No SharePoint sites available.</strong> This could be because:
                </p>
                <ul className="text-sm text-yellow-700 mt-2 ml-4 list-disc">
                  <li>Your Microsoft authentication has expired</li>
                  <li>Your tenant doesn&apos;t have any SharePoint sites</li>
                  <li>You don&apos;t have permission to access SharePoint sites</li>
                </ul>
                <p className="text-sm text-yellow-700 mt-2">
                  Try refreshing or sign out and sign in again.
                </p>
              </div>
            )}

            <Button onClick={handleAddSharePoint} disabled={isAdding || !selectedSite || availableSites.length === 0}>
              {isAdding ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Add SharePoint Site
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
