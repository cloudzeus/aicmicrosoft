"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, Users, Briefcase, ShareAlt, Database, Edit, Trash2, UserPlus, FolderOpen } from "lucide-react"
import { DepartmentModal } from "@/components/management/department-modal"
import { SharePointModal } from "@/components/management/sharepoint-modal"
import { UserAssignmentModal } from "@/components/management/user-assignment-modal"
import { AppLayout } from "@/components/layout/app-layout"
import { toast } from "sonner"

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
    jobTitle?: string | null
  } | null
  positions: Array<{
    id: string
    name: string
    description?: string | null
  }>
  sharePoints: Array<{
    id: string
    displayName: string
    siteUrl: string
    accessLevel: string
  }>
  _count: {
    userDepartments: number
    positions: number
    sharePoints: number
    children: number
  }
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

interface DepartmentSharePoint {
  id: string
  siteId: string
  siteUrl: string
  displayName: string
  accessLevel: string
  isFromTenantSync: boolean
}

interface Stats {
  totalDepartments: number
  totalPositions: number
  totalSharePoints: number
  totalAssignments: number
}

export default function DepartmentsManagementPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [stats, setStats] = useState<Stats>({
    totalDepartments: 0,
    totalPositions: 0,
    totalSharePoints: 0,
    totalAssignments: 0
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSharePointModalOpen, setIsSharePointModalOpen] = useState(false)
  const [isUserAssignmentModalOpen, setIsUserAssignmentModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [selectedDepartmentSharePoints, setSelectedDepartmentSharePoints] = useState<DepartmentSharePoint[]>([])
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [assignedUsers, setAssignedUsers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch departments
      const departmentsResponse = await fetch('/api/departments?includeChildren=true&includeManager=true&includePositions=true')
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments')
      const departmentsData = await departmentsResponse.json()
      console.log('Departments data:', departmentsData.departments?.length || 0, 'departments')
      console.log('Sample department:', departmentsData.departments?.[0])
      setDepartments(departmentsData.departments)

      // Fetch users for manager selection
      const usersResponse = await fetch('/api/users/assignments')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])

      // Fetch positions for position management
      const positionsResponse = await fetch('/api/positions')
      if (!positionsResponse.ok) throw new Error('Failed to fetch positions')
      const positionsData = await positionsResponse.json()
      setPositions(positionsData.positions || [])

      // Calculate stats from departments data
      const totalPositions = departmentsData.departments.reduce((sum: number, dept: Department) => sum + (dept._count?.positions || 0), 0)
      const totalSharePoints = departmentsData.departments.reduce((sum: number, dept: Department) => sum + (dept._count?.sharePoints || 0), 0)
      const totalAssignments = departmentsData.departments.reduce((sum: number, dept: Department) => sum + (dept._count?.userDepartments || 0), 0)

      console.log('Calculated stats:', {
        totalDepartments: departmentsData.departments.length,
        totalPositions,
        totalSharePoints,
        totalAssignments
      })

      setStats({
        totalDepartments: departmentsData.departments.length,
        totalPositions,
        totalSharePoints,
        totalAssignments
      })
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenModal = (department?: Department) => {
    setSelectedDepartment(department || null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedDepartment(null)
  }

  const handleModalSuccess = () => {
    fetchData() // Refresh the data
  }

  const handleOpenSharePointModal = async (department: Department) => {
    setSelectedDepartment(department)
    
    // Fetch SharePoint sites for this department
    try {
      const response = await fetch(`/api/departments/${department.id}/sharepoints`)
      if (response.ok) {
        const data = await response.json()
        setSelectedDepartmentSharePoints(data.sharePoints || [])
      } else {
        console.error('Failed to fetch SharePoint sites')
        setSelectedDepartmentSharePoints([])
      }
    } catch (error) {
      console.error('Error fetching SharePoint sites:', error)
      setSelectedDepartmentSharePoints([])
    }
    
    setIsSharePointModalOpen(true)
  }

  const handleCloseSharePointModal = () => {
    setIsSharePointModalOpen(false)
    setSelectedDepartment(null)
  }

  const handleOpenUserAssignmentModal = async (position: Position) => {
    setSelectedPosition(position)
    
    // Find the department that contains this position
    const department = departments.find(dept => 
      dept.positions.some(pos => pos.id === position.id)
    )
    setSelectedDepartment(department || null)
    
    // Fetch assigned users for this position
    try {
      const response = await fetch(`/api/users/assignments?positionId=${position.id}`)
      if (response.ok) {
        const data = await response.json()
        setAssignedUsers(data.assignments || [])
      } else {
        console.error('Failed to fetch assigned users')
        setAssignedUsers([])
      }
    } catch (error) {
      console.error('Error fetching assigned users:', error)
      setAssignedUsers([])
    }
    
    setIsUserAssignmentModalOpen(true)
  }

  const handleCloseUserAssignmentModal = () => {
    setIsUserAssignmentModalOpen(false)
    setSelectedPosition(null)
    setAssignedUsers([])
  }

  const handleDelete = async (department: Department) => {
    if (department.isFromTenantSync) {
      toast.error("Cannot delete Office 365 synced departments")
      return
    }

    if (!confirm(`Are you sure you want to delete "${department.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/departments/${department.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete department")
      }

      toast.success("Department deleted successfully")
      fetchData() // Refresh the data
    } catch (error) {
      console.error("Error deleting department:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete department")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Building className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
          <p className="text-gray-500">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout pageTitle="Department Management" pageDescription="Manage organizational departments and their structure">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">Manage organizational departments and their structure</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Departments</div>
            <div className="text-3xl font-bold text-foreground">{stats.totalDepartments}</div>
            <p className="text-sm text-muted-foreground mt-1">Active departments</p>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-muted-foreground mb-2">Total Positions</div>
            <div className="text-3xl font-bold text-foreground">{stats.totalPositions}</div>
            <p className="text-sm text-muted-foreground mt-1">Job positions</p>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-muted-foreground mb-2">SharePoint Sites</div>
            <div className="text-3xl font-bold text-foreground">{stats.totalSharePoints}</div>
            <p className="text-sm text-muted-foreground mt-1">Connected sites</p>
          </Card>
          
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="text-sm font-medium text-muted-foreground mb-2">User Assignments</div>
            <div className="text-3xl font-bold text-foreground">{stats.totalAssignments}</div>
            <p className="text-sm text-muted-foreground mt-1">Department memberships</p>
          </Card>
        </div>

      {/* Department List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Departments ({departments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((department) => (
              <Card key={department.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Building className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{department.name}</h3>
                      <p className="text-sm text-muted-foreground">{department.code}</p>
                      {department.description && (
                        <p className="text-sm text-muted-foreground mt-1">{department.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={department.isFromTenantSync ? "default" : "secondary"}>
                          <Database className="w-3 h-3 mr-1" />
                          {department.isFromTenantSync ? 'Office 365' : 'Local'}
                        </Badge>
                        {department.parent && (
                          <Badge variant="outline">
                            Parent: {department.parent.name}
                          </Badge>
                        )}
                        {department.manager && (
                          <Badge variant="outline">
                            Manager: {department.manager.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{department._count.userDepartments}</div>
                      <div className="text-xs text-muted-foreground">Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{department._count.positions}</div>
                      <div className="text-xs text-muted-foreground">Positions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{department._count.sharePoints}</div>
                      <div className="text-xs text-muted-foreground">Sites</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-foreground">{department._count.children}</div>
                      <div className="text-xs text-muted-foreground">Sub-depts</div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/management/users?department=${department.id}`)}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Users
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => router.push(`/management/positions?department=${department.id}`)}>
                        <Briefcase className="w-4 h-4 mr-1" />
                        Positions
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenSharePointModal(department)}>
                        <FolderOpen className="w-4 h-4 mr-1" />
                        SharePoint
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenModal(department)}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      {!department.isFromTenantSync && (
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(department)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Department Positions */}
                {department.positions && department.positions.length > 0 && (
                  <div className="ml-16 mt-4 space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">Positions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {department.positions.map((position) => (
                        <div key={position.id} className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {position.name}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenUserAssignmentModal(position)}
                            className="h-7 px-3 text-xs"
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign Users
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {departments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No departments found</p>
                <Button onClick={() => handleOpenModal()} className="mt-4">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Department
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Department Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Department Hierarchy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {departments
              .filter(dept => !dept.parentId)
              .map((department) => (
                <div key={department.id} className="ml-0">
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <Building className="w-4 h-4" />
                    <span className="font-medium">{department.name}</span>
                    <Badge variant="outline" className="text-xs">{department.code}</Badge>
                    <span className="text-sm text-gray-500">
                      ({department._count.positions} positions, {department._count.userDepartments} users)
                    </span>
                  </div>
                  {departments
                    .filter(child => child.parentId === department.id)
                    .map((child) => (
                      <div key={child.id} className="ml-6 mt-2">
                        <div className="flex items-center gap-2 p-2 border rounded bg-gray-50">
                          <Building className="w-4 h-4" />
                          <span>{child.name}</span>
                          <Badge variant="outline" className="text-xs">{child.code}</Badge>
                          <span className="text-sm text-gray-500">
                            ({child._count.positions} positions, {child._count.userDepartments} users)
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Department Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        department={selectedDepartment}
        departments={departments}
        users={users}
        positions={positions}
        onSuccess={handleModalSuccess}
      />

      {/* SharePoint Modal */}
      {selectedDepartment && (
        <SharePointModal
          isOpen={isSharePointModalOpen}
          onClose={handleCloseSharePointModal}
          departmentId={selectedDepartment.id}
          departmentName={selectedDepartment.name}
          sharePoints={selectedDepartmentSharePoints}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* User Assignment Modal */}
      {selectedPosition && selectedDepartment && (
        <UserAssignmentModal
          isOpen={isUserAssignmentModalOpen}
          onClose={handleCloseUserAssignmentModal}
          positionId={selectedPosition.id}
          positionName={selectedPosition.name}
          department={selectedDepartment}
          assignedUsers={assignedUsers}
          allUsers={users}
          onSuccess={handleModalSuccess}
        />
      )}
      </div>
    </AppLayout>
  )
}