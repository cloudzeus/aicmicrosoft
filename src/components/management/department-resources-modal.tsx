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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Trash2, Plus, Loader2, ExternalLink, FolderOpen, Mail, Users, Check, ChevronsUpDown, Search, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DepartmentResource {
  id: string
  resourceId: string
  displayName: string
  emailAddress?: string
  description?: string
  accessLevel?: string
  groupType?: string
  isFromTenantSync: boolean
}

interface AvailableResource {
  id: string
  displayName: string
  emailAddress?: string
  description?: string
  groupType?: string
}

interface DepartmentResourcesModalProps {
  isOpen: boolean
  onClose: () => void
  departmentId: string
  departmentName: string
  resourceType: 'sharepoint' | 'mailbox' | 'group'
  resources: DepartmentResource[]
  onSuccess: () => void
}

export function DepartmentResourcesModal({
  isOpen,
  onClose,
  departmentId,
  departmentName,
  resourceType,
  resources,
  onSuccess
}: DepartmentResourcesModalProps) {
  const [availableResources, setAvailableResources] = useState<AvailableResource[]>([])
  const [isLoadingResources, setIsLoadingResources] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [selectedResources, setSelectedResources] = useState<AvailableResource[]>([])
  const [isResourceComboOpen, setIsResourceComboOpen] = useState(false)
  const [newResource, setNewResource] = useState({
    accessLevel: "READ"
  })

  // Fetch available resources when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableResources()
      setSelectedResources([])
    }
  }, [isOpen, resourceType])

  const fetchAvailableResources = async () => {
    setIsLoadingResources(true)
    try {
      let endpoint = ''
      switch (resourceType) {
        case 'sharepoint':
          endpoint = '/api/sharepoint/sites'
          break
        case 'mailbox':
          endpoint = '/api/mailboxes'
          break
        case 'group':
          endpoint = '/api/groups'
          break
      }

      const response = await fetch(endpoint)
      if (response.ok) {
        const data = await response.json()
        const resourceKey = resourceType === 'sharepoint' ? 'sites' : 
                           resourceType === 'mailbox' ? 'mailboxes' : 'groups'
        console.log(`${resourceType} resources fetched:`, data[resourceKey]?.length || 0, 'resources')
        setAvailableResources(data[resourceKey] || [])
      } else {
        const errorData = await response.json()
        console.error(`Failed to fetch ${resourceType} resources:`, errorData)
        toast.error(`Failed to fetch ${resourceType} resources from your tenant`)
        setAvailableResources([])
      }
    } catch (error) {
      console.error(`Error fetching ${resourceType} resources:`, error)
      toast.error(`Failed to fetch ${resourceType} resources from your tenant`)
      setAvailableResources([])
    } finally {
      setIsLoadingResources(false)
    }
  }

  const handleAddResources = async () => {
    if (selectedResources.length === 0) {
      toast.error('Please select at least one resource')
      return
    }

    setIsAdding(true)
    try {
      const promises = selectedResources.map(resource => {
        const resourceData = {
          ...resource,
          accessLevel: newResource.accessLevel
        }

        // Map resource properties based on type
        let mappedData: any = {
          displayName: resource.displayName,
          accessLevel: newResource.accessLevel
        }

        if (resourceType === 'sharepoint') {
          mappedData = {
            siteId: resource.id,
            siteUrl: resource.emailAddress || '',
            displayName: resource.displayName,
            accessLevel: newResource.accessLevel
          }
        } else if (resourceType === 'mailbox') {
          mappedData = {
            mailboxId: resource.id,
            emailAddress: resource.emailAddress || '',
            displayName: resource.displayName,
            accessLevel: newResource.accessLevel
          }
        } else if (resourceType === 'group') {
          mappedData = {
            groupId: resource.id,
            displayName: resource.displayName,
            emailAddress: resource.emailAddress,
            description: resource.description,
            groupType: resource.groupType || 'SECURITY'
          }
        }

        const endpoint = `/api/departments/${departmentId}/${resourceType}s`
        return fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mappedData)
        })
      })

      const responses = await Promise.all(promises)
      const failedResponses = responses.filter(response => !response.ok)
      
      if (failedResponses.length === 0) {
        toast.success(`${selectedResources.length} ${resourceType}(s) added successfully`)
        setSelectedResources([])
        onSuccess()
      } else {
        toast.error(`Failed to add ${failedResponses.length} ${resourceType}(s)`)
      }
    } catch (error) {
      console.error(`Error adding ${resourceType}s:`, error)
      toast.error(`Failed to add ${resourceType}s`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    setIsDeleting(resourceId)
    try {
      const response = await fetch(`/api/departments/${departmentId}/${resourceType}s/${resourceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success(`${resourceType} deleted successfully`)
        onSuccess()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || `Failed to delete ${resourceType}`)
      }
    } catch (error) {
      console.error(`Error deleting ${resourceType}:`, error)
      toast.error(`Failed to delete ${resourceType}`)
    } finally {
      setIsDeleting(null)
    }
  }

  const accessLevelLabels = {
    READ: "Read",
    CONTRIBUTE: "Contribute", 
    OWNER: "Owner"
  }

  const groupTypeLabels = {
    SECURITY: "Security",
    DISTRIBUTION: "Distribution",
    UNIFIED: "Unified",
    MICROSOFT365: "Microsoft 365"
  }

  const getResourceIcon = () => {
    switch (resourceType) {
      case 'sharepoint':
        return <FolderOpen className="w-5 h-5" />
      case 'mailbox':
        return <Mail className="w-5 h-5" />
      case 'group':
        return <Users className="w-5 h-5" />
    }
  }

  const getResourceTitle = () => {
    switch (resourceType) {
      case 'sharepoint':
        return 'SharePoint Sites'
      case 'mailbox':
        return 'Mailboxes'
      case 'group':
        return 'Groups'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getResourceIcon()}
            {getResourceTitle()} - {departmentName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto">
          {/* Current Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Current {getResourceTitle()}</h3>
            {resources.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resources.map((resource) => (
                  <div key={resource.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{resource.displayName}</h4>
                        <Badge variant={resource.isFromTenantSync ? "default" : "secondary"} className="text-xs">
                          {resource.isFromTenantSync ? "Office 365" : "Local"}
                        </Badge>
                        {resource.accessLevel && (
                          <Badge variant="outline" className="text-xs">
                            {accessLevelLabels[resource.accessLevel as keyof typeof accessLevelLabels]}
                          </Badge>
                        )}
                        {resource.groupType && (
                          <Badge variant="outline" className="text-xs">
                            {groupTypeLabels[resource.groupType as keyof typeof groupTypeLabels]}
                          </Badge>
                        )}
                      </div>
                      {resource.emailAddress && (
                        <p className="text-sm text-gray-600">{resource.emailAddress}</p>
                      )}
                      {resource.description && (
                        <p className="text-sm text-gray-600">{resource.description}</p>
                      )}
                      <p className="text-xs text-gray-500">ID: {resource.resourceId}</p>
                    </div>
                    <div className="flex gap-2">
                      {resource.emailAddress && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(resource.emailAddress, '_blank')}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteResource(resource.id)}
                        disabled={isDeleting === resource.id}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        {isDeleting === resource.id ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No {getResourceTitle().toLowerCase()} assigned to this department</p>
            )}
          </div>

          {/* Add New Resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Add New {getResourceTitle()}</h3>
            
            <div className="flex gap-2">
              <Popover open={isResourceComboOpen} onOpenChange={setIsResourceComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isResourceComboOpen}
                    className="flex-1 justify-between"
                  >
                    {selectedResources.length > 0 
                      ? `${selectedResources.length} resource(s) selected`
                      : `Select ${getResourceTitle().toLowerCase()}...`
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder={`Search ${getResourceTitle().toLowerCase()}...`} />
                    <CommandEmpty>
                      {isLoadingResources ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Loading {getResourceTitle().toLowerCase()}...
                        </div>
                      ) : (
                        `No ${getResourceTitle().toLowerCase()} found.`
                      )}
                    </CommandEmpty>
                    <CommandGroup className="max-h-60 overflow-y-auto">
                      {availableResources.map((resource) => (
                        <CommandItem
                          key={resource.id}
                          value={resource.displayName}
                          onSelect={() => {
                            const isSelected = selectedResources.some(r => r.id === resource.id)
                            if (isSelected) {
                              setSelectedResources(prev => prev.filter(r => r.id !== resource.id))
                            } else {
                              setSelectedResources(prev => [...prev, resource])
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedResources.some(r => r.id === resource.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{resource.displayName}</div>
                            {resource.emailAddress && (
                              <div className="text-sm text-gray-500">{resource.emailAddress}</div>
                            )}
                            {resource.description && (
                              <div className="text-sm text-gray-500">{resource.description}</div>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              
              <Button
                onClick={fetchAvailableResources}
                variant="outline"
                size="sm"
                disabled={isLoadingResources}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingResources ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Access Level Selection (for SharePoint and Mailbox) */}
            {(resourceType === 'sharepoint' || resourceType === 'mailbox') && (
              <div className="space-y-2">
                <Label htmlFor="accessLevel">Access Level</Label>
                <Select
                  value={newResource.accessLevel}
                  onValueChange={(value) => setNewResource(prev => ({ ...prev, accessLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="READ">Read</SelectItem>
                    <SelectItem value="CONTRIBUTE">Contribute</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button
              onClick={handleAddResources}
              disabled={isAdding || selectedResources.length === 0}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding {selectedResources.length} {getResourceTitle().toLowerCase()}...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add {selectedResources.length} {getResourceTitle().toLowerCase()}
                </>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
