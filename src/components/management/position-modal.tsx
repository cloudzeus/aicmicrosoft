"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Briefcase, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Position {
  id: string
  name: string
  description?: string | null
  departmentId: string
  isFromTenantSync: boolean
  department: {
    id: string
    name: string
    code: string
  }
}

interface Department {
  id: string
  name: string
  code: string
}

interface PositionModalProps {
  isOpen: boolean
  onClose: () => void
  position?: Position | null
  departments: Department[]
  onSuccess: () => void
}

export function PositionModal({
  isOpen,
  onClose,
  position,
  departments,
  onSuccess
}: PositionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    departmentId: ""
  })
  const [isLoading, setIsLoading] = useState(false)

  const isEdit = !!position

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name,
        description: position.description || "",
        departmentId: position.departmentId
      })
    } else {
      setFormData({
        name: "",
        description: "",
        departmentId: ""
      })
    }
  }, [position, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = position 
        ? `/api/positions/${position.id}`
        : "/api/positions"
      
      const method = position ? "PUT" : "POST"
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || undefined,
          departmentId: formData.departmentId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save position")
      }

      toast.success(position ? "Position updated successfully" : "Position created successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving position:", error)
      toast.error(error instanceof Error ? error.message : "Failed to save position")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!position || position.isFromTenantSync) return
    
    if (!confirm(`Are you sure you want to delete "${position.name}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/positions/${position.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete position")
      }

      toast.success("Position deleted successfully")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error deleting position:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete position")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            {isEdit ? "Edit Position" : "Create New Position"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Position Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Sales Representative"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Position description..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="departmentId">Department *</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {isEdit && !position.isFromTenantSync && (
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
