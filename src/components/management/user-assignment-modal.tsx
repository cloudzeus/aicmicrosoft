"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserCheck, Loader2, Check, ChevronsUpDown, X, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string | null
  email: string
  jobTitle?: string | null
  role: string
}

interface UserAssignment {
  id: string
  assignedAt: Date
  user: User
}

interface Position {
  id: string
  name: string
  description?: string | null
  departmentId: string
  isFromTenantSync: boolean
}

interface Department {
  id: string
  name: string
  code: string
  positions: Position[]
}

interface UserAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  positionId?: string
  positionName?: string
  department?: Department
  assignedUsers: UserAssignment[]
  allUsers: User[]
  onSuccess: () => void
}

export function UserAssignmentModal({
  isOpen,
  onClose,
  positionId,
  positionName,
  department,
  assignedUsers,
  allUsers,
  onSuccess
}: UserAssignmentModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isUserComboOpen, setIsUserComboOpen] = useState(false)
  const [isPositionComboOpen, setIsPositionComboOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      console.log('UserAssignmentModal opened with:', {
        positionId,
        positionName,
        department: department?.name,
        positionsCount: department?.positions.length || 0,
        assignedUsersCount: assignedUsers.length,
        allUsersCount: allUsers.length,
        sampleUsers: allUsers.slice(0, 3).map(u => ({ id: u.id, name: u.name, email: u.email }))
      })
      
      // Set currently assigned users when modal opens
      setSelectedUsers(assignedUsers.map(assignment => assignment.user))
      
      // Set selected position if positionId is provided
      if (positionId && department) {
        const position = department.positions.find(p => p.id === positionId)
        console.log('Found position:', position)
        setSelectedPosition(position || null)
      } else if (department && department.positions.length > 0) {
        // If no specific position selected, select the first one
        console.log('No positionId, selecting first position:', department.positions[0])
        setSelectedPosition(department.positions[0])
      }
    }
  }, [assignedUsers, isOpen, positionId, department, allUsers])

  const handleUserToggle = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id)
      if (isSelected) {
        return prev.filter(u => u.id !== user.id)
      } else {
        return [...prev, user]
      }
    })
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId))
  }

  const handlePositionSelect = (position: Position) => {
    setSelectedPosition(position)
    // Clear selected users when position changes
    setSelectedUsers([])
  }

  const syncUserToLocal = async (user: User) => {
    try {
      const response = await fetch('/api/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          jobTitle: user.jobTitle,
          role: user.role || 'USER'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Sync user error:', errorData)
        throw new Error(`Failed to sync user: ${errorData.error || response.statusText}`)
      }

      const syncedUser = await response.json()
      console.log('User synced successfully:', syncedUser)
      return syncedUser.user
    } catch (error) {
      console.error('Error syncing user:', error)
      throw error
    }
  }

  const handleSave = async () => {
    console.log('handleSave called with selectedPosition:', selectedPosition)
    if (!selectedPosition) {
      console.log('No position selected, showing error')
      toast.error("Please select a position first")
      return
    }

    setIsLoading(true)

    try {
      // Get current user IDs
      const currentUserIds = assignedUsers.map(assignment => assignment.user.id)
      const newUserIds = selectedUsers.map(user => user.id)

      console.log('User assignment debug:', {
        positionId: selectedPosition.id,
        currentUserIds,
        newUserIds,
        assignedUsers: assignedUsers.length,
        selectedUsers: selectedUsers.length
      })

      // Find users to add
      const usersToAdd = newUserIds.filter(id => !currentUserIds.includes(id))
      
      // Find users to remove
      const usersToRemove = currentUserIds.filter(id => !newUserIds.includes(id))

      console.log('Changes to make:', {
        usersToAdd,
        usersToRemove
      })

      // Sync users to local database before assignment
      const usersToSync = selectedUsers.filter(user => usersToAdd.includes(user.id))
      console.log('Users to sync:', usersToSync.map(u => ({ id: u.id, name: u.name, email: u.email })))
      
      const userSyncMap = new Map<string, string>() // tenantId -> localId
      for (const user of usersToSync) {
        try {
          const syncedUser = await syncUserToLocal(user)
          userSyncMap.set(user.id, syncedUser.id) // Map tenant ID to local ID
        } catch (error) {
          console.error(`Failed to sync user ${user.email}:`, error)
          // Continue with other users even if one fails
        }
      }

      // Update the usersToAdd array with local database IDs
      const localUserIds = usersToAdd.map(tenantId => {
        return userSyncMap.get(tenantId) || tenantId
      })

      // Remove users from position
      for (const userId of usersToRemove) {
        console.log(`Removing user ${userId} from position ${selectedPosition.id}`)
        const removeResponse = await fetch(`/api/users/${userId}/positions/${selectedPosition.id}`, {
          method: "DELETE",
        })
        
        if (!removeResponse.ok) {
          const errorData = await removeResponse.json()
          console.error('Remove user error:', errorData)
          throw new Error(`Failed to remove user: ${errorData.error || removeResponse.statusText}`)
        }
      }

      // Add users to position using local database IDs
      for (const localUserId of localUserIds) {
        console.log(`Adding user ${localUserId} to position ${selectedPosition.id}`)
        console.log('Selected users:', selectedUsers.map(u => ({ id: u.id, name: u.name, email: u.email })))
        console.log('Local user IDs to add:', localUserIds)
        
        const addResponse = await fetch(`/api/users/${localUserId}/positions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            positionId: selectedPosition.id,
          }),
        })
        
        console.log('Add response status:', addResponse.status)
        
        if (!addResponse.ok) {
          const errorData = await addResponse.json()
          console.error('Add user error:', errorData)
          console.error('User ID that failed:', localUserId)
          throw new Error(`Failed to add user: ${errorData.error || addResponse.statusText}`)
        }
      }

      toast.success("User assignments updated successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error updating user assignments:", error)
      toast.error("Failed to update user assignments")
    } finally {
      setIsLoading(false)
    }
  }

  // Available users (all users minus currently assigned ones)
  const availableUsers = allUsers.filter(user => 
    !assignedUsers.some(assignment => assignment.user.id === user.id)
  )

  // Debug logging
  console.log('UserAssignmentModal - allUsers:', allUsers.length, allUsers)
  console.log('UserAssignmentModal - assignedUsers:', assignedUsers.length, assignedUsers)
  console.log('UserAssignmentModal - availableUsers:', availableUsers.length, availableUsers)
  console.log('UserAssignmentModal - selectedUsers:', selectedUsers.length, selectedUsers)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            {department ? `Assign Users to Department: ${department.name}` : `Assign Users to Position: ${positionName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Position Selection - Only show if no specific position is selected */}
          {department && department.positions.length > 0 && !positionId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Position</label>
              <Popover open={isPositionComboOpen} onOpenChange={setIsPositionComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPositionComboOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    {selectedPosition ? selectedPosition.name : "Select a position..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search positions..." className="h-9" />
                    <CommandEmpty>No positions found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-y-auto">
                      {department.positions.map((position) => (
                        <CommandItem
                          key={position.id}
                          value={position.name}
                          onSelect={() => handlePositionSelect(position)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPosition?.id === position.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <span className="font-medium">{position.name}</span>
                            {position.description && (
                              <span className="text-sm text-gray-500">{position.description}</span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Show selected position info when position is pre-selected */}
          {positionId && selectedPosition && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Position</label>
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedPosition.name}</div>
                {selectedPosition.description && (
                  <div className="text-sm text-muted-foreground mt-1">{selectedPosition.description}</div>
                )}
              </div>
            </div>
          )}

          {/* Currently Assigned Users */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {selectedPosition ? `Currently Assigned Users to ${selectedPosition.name}` : "Currently Assigned Users"}
            </label>
            {selectedUsers.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <Badge key={user.id} variant="default" className="flex items-center gap-1">
                    {user.name || user.email}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No users assigned to this position</p>
            )}
          </div>

          {/* Add Users */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Users</label>
            <Popover open={isUserComboOpen} onOpenChange={setIsUserComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isUserComboOpen}
                  className="w-full justify-between"
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Select users to assign...
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search users..." className="h-9" />
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-y-auto">
                    {availableUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.name || ''} ${user.email || ''} ${user.jobTitle || ''}`}
                        onSelect={() => handleUserToggle(user)}
                        className="cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUsers.some(u => u.id === user.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-1">
                          <span className="font-medium">{user.name || user.email}</span>
                          {user.jobTitle && (
                            <span className="text-sm text-gray-500">{user.jobTitle}</span>
                          )}
                          <span className="text-xs text-gray-400">{user.role}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* User Statistics */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Currently Assigned:</span>
                <span className="ml-2 text-blue-600">{selectedUsers.length}</span>
              </div>
              <div>
                <span className="font-medium">Available Users:</span>
                <span className="ml-2 text-green-600">{availableUsers.length}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Save Assignments
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
