"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UserCheck, Loader2, Check, ChevronsUpDown, X, UserPlus, Building, Briefcase } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface User {
  id: string
  name: string | null
  email: string
  jobTitle?: string | null
  role: string
}

interface Department {
  id: string
  name: string
  code: string
}

interface Position {
  id: string
  name: string
  department: {
    id: string
    name: string
    code: string
  }
}

interface UserAssignment {
  id: string
  assignedAt: Date
  user: User
}

interface UserAssignmentsModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  type: 'departments' | 'positions'
  departments: Department[]
  positions: Position[]
  assignedItems: UserAssignment[]
  onSuccess: () => void
}

export function UserAssignmentsModal({
  isOpen,
  onClose,
  user,
  type,
  departments,
  positions,
  assignedItems,
  onSuccess
}: UserAssignmentsModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpenCombo, setIsOpenCombo] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const availableItems = type === 'departments' ? departments : positions
  const assignedItemIds = assignedItems.map(item => 
    type === 'departments' ? item.user.id : item.id
  )

  useEffect(() => {
    if (isOpen) {
      setSelectedItems(assignedItemIds)
      setSearchQuery("")
    }
  }, [isOpen, assignedItemIds])

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const addedItems = selectedItems.filter(id => !assignedItemIds.includes(id))
      const removedItems = assignedItemIds.filter(id => !selectedItems.includes(id))

      // Handle additions
      for (const itemId of addedItems) {
        if (type === 'departments') {
          await fetch('/api/users/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              departmentId: itemId,
              isPrimary: false
            })
          })
        } else {
          await fetch('/api/users/assignments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              positionId: itemId
            })
          })
        }
      }

      // Handle removals
      for (const itemId of removedItems) {
        const assignment = assignedItems.find(item => 
          type === 'departments' ? item.user.id === itemId : item.id === itemId
        )
        if (assignment) {
          await fetch(`/api/users/assignments/${assignment.id}`, {
            method: 'DELETE'
          })
        }
      }

      toast.success(`${type === 'departments' ? 'Departments' : 'Positions'} updated successfully`)
      onSuccess()
    } catch (error) {
      console.error(`Error updating ${type}:`, error)
      toast.error(`Failed to update ${type}`)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (type === 'departments' ? 
      ('code' in item ? item.code.toLowerCase().includes(searchQuery.toLowerCase()) : false) : 
      ('department' in item ? item.department.name.toLowerCase().includes(searchQuery.toLowerCase()) : false))
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'departments' ? <Building className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            Assign {type === 'departments' ? 'Departments' : 'Positions'} to {user.name || user.email}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search {type === 'departments' ? 'Departments' : 'Positions'}</label>
            <Command>
              <CommandInput
                placeholder={`Search ${type}...`}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandEmpty>No {type} found.</CommandEmpty>
              <CommandGroup className="max-h-64 overflow-auto">
                {filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id)
                  return (
                    <CommandItem
                      key={item.id}
                      onSelect={() => handleToggleItem(item.id)}
                      className="flex items-center gap-2"
                    >
                      <div className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}>
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {type === 'departments' ? (
                          <div className="text-sm text-gray-500">{'code' in item ? item.code : ''}</div>
                        ) : (
                          <div className="text-sm text-gray-500">{'department' in item ? `${item.department.name} (${item.department.code})` : ''}</div>
                        )}
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </Command>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Selected {type === 'departments' ? 'Departments' : 'Positions'}</label>
              <div className="flex flex-wrap gap-2">
                {selectedItems.map((itemId) => {
                  const item = availableItems.find(i => i.id === itemId)
                  if (!item) return null
                  
                  return (
                    <Badge key={itemId} variant="secondary" className="flex items-center gap-1">
                      {item.name}
                      <button
                        onClick={() => handleToggleItem(itemId)}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
