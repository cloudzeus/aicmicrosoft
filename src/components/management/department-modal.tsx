"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Building, Loader2, Check, ChevronsUpDown, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Department {
  id: string
  name: string
  code: string
  description?: string | null
  parentId?: string | null
  managerId?: string | null
  isFromTenantSync: boolean
  parent?: {
    id: string
    name: string
    code: string
  } | null
  manager?: {
    id: string
    name: string
    email: string
  } | null
}

interface User {
  id: string
  name: string | null
  email: string
}

interface Position {
  id: string
  name: string
  description?: string | null
  departmentId: string
  isFromTenantSync: boolean
}

interface DepartmentModalProps {
  isOpen: boolean
  onClose: () => void
  department?: Department | null
  departments: Department[]
  users: User[]
  positions: Position[]
  onSuccess: () => void
}

export function DepartmentModal({
  isOpen,
  onClose,
  department,
  departments,
  users,
  positions,
  onSuccess
}: DepartmentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parentId: "none",
    managerId: ""
  })
  const [selectedPositions, setSelectedPositions] = useState<Position[]>([])
  const [isPositionComboOpen, setIsPositionComboOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isEdit = !!department

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        code: department.code,
        description: department.description || "",
        parentId: department.parentId || "none",
        managerId: department.managerId || "none"
      })
      // Set current positions for this department
      const currentPositions = positions.filter(pos => pos.departmentId === department.id)
      setSelectedPositions(currentPositions)
    } else {
      setFormData({
        name: "",
        code: "",
        description: "",
        parentId: "none",
        managerId: "none"
      })
      setSelectedPositions([])
    }
  }, [department, isOpen, positions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = department 
        ? `/api/departments/${department.id}`
        : "/api/departments"
      
      const method = department ? "PUT" : "POST"
      
      const requestData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        description: formData.description || undefined,
        parentId: formData.parentId === "none" ? null : formData.parentId || undefined,
        managerId: formData.managerId && formData.managerId !== "none" ? formData.managerId : null,
      }

      console.log('Department submit data:', {
        formData,
        requestData,
        method,
        url
      })
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save department")
      }

      const result = await response.json()
      const departmentId = result.department?.id || department?.id

      // Update positions for this department
      if (departmentId && selectedPositions.length > 0) {
        for (const position of selectedPositions) {
          await fetch(`/api/positions/${position.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: position.name,
              description: position.description,
              departmentId: departmentId,
            }),
          })
        }
      }

      toast.success(department ? "Department updated successfully" : "Department created successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving department:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save department")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!department || department.isFromTenantSync) return
    
    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete department")
      }

      toast.success("Department deleted successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting department:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete department")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePositionToggle = (position: Position) => {
    setSelectedPositions(prev => {
      const isSelected = prev.some(p => p.id === position.id)
      if (isSelected) {
        return prev.filter(p => p.id !== position.id)
      } else {
        return [...prev, position]
      }
    })
  }

  const handleRemovePosition = (positionId: string) => {
    setSelectedPositions(prev => prev.filter(p => p.id !== positionId))
  }

  // Available positions (not already assigned to other departments or current department)
  const availablePositions = positions.filter(position => {
    // If editing, include current department's positions
    if (isEdit && position.departmentId === department?.id) {
      return true
    }
    // For new departments or positions from other departments, only show unassigned positions
    return !position.departmentId
  })

  // Filter out current department and its children from parent options
  const availableParents = departments.filter(dept => 
    dept.id !== department?.id && dept.parentId !== department?.id
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            {isEdit ? "Edit Department" : "Create New Department"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Department Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Sales Department"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Department Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SALES"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Department description..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="parentId">Parent Department</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent department</SelectItem>
                  {availableParents.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="managerId">Department Manager</Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No manager assigned</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Department Positions</Label>
            <div className="space-y-2">
              {/* Selected positions as badges */}
              {selectedPositions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedPositions.map((position) => (
                    <Badge key={position.id} variant="secondary" className="flex items-center gap-1">
                      {position.name}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemovePosition(position.id)}
                        disabled={isLoading}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              
              {/* Position combo box */}
              <Popover open={isPositionComboOpen} onOpenChange={setIsPositionComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isPositionComboOpen}
                    className="w-full justify-between"
                    disabled={isLoading}
                  >
                    Add positions...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search positions..." />
                    <CommandEmpty>No positions found.</CommandEmpty>
                    <CommandGroup>
                      {availablePositions.map((position) => (
                        <CommandItem
                          key={position.id}
                          value={position.name}
                          onSelect={() => handlePositionToggle(position)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedPositions.some(p => p.id === position.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {position.name}
                          {position.description && (
                            <span className="ml-2 text-sm text-gray-500">- {position.description}</span>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {isEdit && !department.isFromTenantSync && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Loader2 className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                {isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
