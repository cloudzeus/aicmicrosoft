"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2, User, Mail, Briefcase, Building } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  name: string | null
  email: string
  jobTitle?: string | null
  department?: string | null
  officeLocation?: string | null
  role: string
  tenantId?: string | null
  isFromTenantSync: boolean
}

interface UserEditModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onSuccess: () => void
}

export function UserEditModal({
  isOpen,
  onClose,
  user,
  onSuccess
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    jobTitle: "",
    officeLocation: "",
    role: "USER"
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email,
        jobTitle: user.jobTitle || "",
        officeLocation: user.officeLocation || "",
        role: user.role
      })
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (!user) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user')
      }

      toast.success('User updated successfully')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    if (!confirm(`Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      toast.success('User deleted successfully')
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete user')
    } finally {
      setIsLoading(false)
    }
  }

  const isEdit = !!user

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {isEdit ? "Edit User" : "Create New User"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., John Doe"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., john.doe@company.com"
              disabled={isLoading || user?.isFromTenantSync}
            />
            {user?.isFromTenantSync && (
              <p className="text-xs text-gray-500">
                Email cannot be changed for Office 365 synced users
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g., Software Engineer"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="officeLocation">Office Location</Label>
            <Input
              id="officeLocation"
              value={formData.officeLocation}
              onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
              placeholder="e.g., New York Office"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">User</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              {isEdit && !user?.isFromTenantSync && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  Delete User
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <User className="w-4 h-4" />
                )}
                {isEdit ? "Update User" : "Create User"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
