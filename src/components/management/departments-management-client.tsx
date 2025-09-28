"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, Users, Loader2, Briefcase, Share } from "lucide-react"
import { DepartmentsTreeTable } from "@/components/management/departments-tree-table"
import { DepartmentModal } from "@/components/management/department-modal"
import { DepartmentResourcesModal } from "@/components/management/department-resources-modal"
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
  jobTitle?: string | null
  tenantId?: string | null
  isFromTenantSync: boolean
  userPositions: Array<{
    id: string
    assignedAt: Date
    position: {
      id: string
      name: string
      department: {
        id: string
        name: string
        code: string
      }
    }
  }>
}

interface DepartmentsManagementClientProps {
  initialDepartments: Department[]
  initialUsers: User[]
}

export function DepartmentsManagementClient({ 
  initialDepartments, 
  initialUsers 
}: DepartmentsManagementClientProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [stats, setStats] = useState({
    totalDepartments: 0,
    activeDepartments: 0,
    inactiveDepartments: 0,
    totalPositions: 0,
    totalUsers: 0,
    departmentsWithUsers: 0,
    totalSharePoints: 0,
    office365Departments: 0,
    localDepartments: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showDepartmentModal, setShowDepartmentModal] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)
  const [positions, setPositions] = useState<any[]>([])
  const [showResourcesModal, setShowResourcesModal] = useState(false)
  const [resourceType, setResourceType] = useState<'sharepoint' | 'mailbox' | 'group'>('sharepoint')
  const [departmentResources, setDepartmentResources] = useState<any[]>([])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch departments
      const departmentsResponse = await fetch('/api/departments')
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments')
      const departmentsData = await departmentsResponse.json()
      
      console.log('Departments data received:', {
        totalDepartments: departmentsData.departments?.length || 0,
        sampleDepartment: departmentsData.departments?.[0] ? {
          id: departmentsData.departments[0].id,
          name: departmentsData.departments[0].name,
          code: departmentsData.departments[0].code,
          hasPositions: !!departmentsData.departments[0].positions,
          positionsCount: departmentsData.departments[0].positions?.length || 0,
          hasCount: !!departmentsData.departments[0]._count,
          countData: departmentsData.departments[0]._count
        } : null
      })
      
      setDepartments(departmentsData.departments || [])

      // Fetch users with assignments
      const usersResponse = await fetch('/api/users?includeAssignments=true')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])

      // Fetch positions
      const positionsResponse = await fetch('/api/positions')
      if (!positionsResponse.ok) throw new Error('Failed to fetch positions')
      const positionsData = await positionsResponse.json()
      setPositions(positionsData.positions || [])

      // Calculate comprehensive stats
      const departmentsList = departmentsData.departments || []
      const usersList = usersData.users || []
      
      // Department statistics
      const totalDepartments = departmentsList.length
      const activeDepartments = departmentsList.filter(dept => 
        (dept._count?.positions || 0) > 0
      ).length
      const inactiveDepartments = totalDepartments - activeDepartments
      const totalPositions = departmentsList.reduce((sum: number, dept: Department) => 
        sum + (dept._count?.positions || 0), 0
      )
      
      // User statistics
      const totalUsers = usersList.length
      const departmentsWithUsers = departmentsList.filter(dept => 
        usersList.some(user => 
          user.userPositions?.some(up => up.position.department.id === dept.id)
        )
      ).length
      
      // SharePoint statistics
      const totalSharePoints = departmentsList.reduce((sum: number, dept: Department) => 
        sum + (dept._count?.sharePoints || 0), 0
      )
      
      // Sync statistics
      const office365Departments = departmentsList.filter(dept => dept.isFromTenantSync).length
      const localDepartments = departmentsList.filter(dept => !dept.isFromTenantSync).length

      setStats({
        totalDepartments,
        activeDepartments,
        inactiveDepartments,
        totalPositions,
        totalUsers,
        departmentsWithUsers,
        totalSharePoints,
        office365Departments,
        localDepartments
      })

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Calculate initial stats
    const totalDepartments = initialDepartments.length
    const activeDepartments = initialDepartments.filter(dept => 
      (dept._count?.positions || 0) > 0
    ).length
    const inactiveDepartments = totalDepartments - activeDepartments
    const totalPositions = initialDepartments.reduce((sum: number, dept: Department) => 
      sum + (dept._count?.positions || 0), 0
    )
    
    const totalUsers = initialUsers.length
    const departmentsWithUsers = initialDepartments.filter(dept => 
      initialUsers.some(user => 
        user.userPositions?.some(up => up.position.department.id === dept.id)
      )
    ).length
    
    const totalSharePoints = initialDepartments.reduce((sum: number, dept: Department) => 
      sum + (dept._count?.sharePoints || 0), 0
    )
    
    const office365Departments = initialDepartments.filter(dept => dept.isFromTenantSync).length
    const localDepartments = initialDepartments.filter(dept => !dept.isFromTenantSync).length

    setStats({
      totalDepartments,
      activeDepartments,
      inactiveDepartments,
      totalPositions,
      totalUsers,
      departmentsWithUsers,
      totalSharePoints,
      office365Departments,
      localDepartments
    })
  }, [initialDepartments, initialUsers])

  const handleCreateDepartment = () => {
    setSelectedDepartment(null)
    setShowDepartmentModal(true)
  }

  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setShowDepartmentModal(true)
  }

  const handleDeleteDepartment = (department: Department) => {
    console.log('Delete department:', department)
    toast.info('Delete department functionality coming soon')
  }

  const handleAssignUsers = (department: Department) => {
    console.log('Assign users to department:', department)
    toast.info('Assign users functionality coming soon')
  }

  const handleManageSharePoints = async (department: Department) => {
    try {
      setSelectedDepartment(department)
      setResourceType('sharepoint')
      
      // Fetch current SharePoint sites for this department
      const response = await fetch(`/api/departments/${department.id}/sharepoints`)
      if (response.ok) {
        const data = await response.json()
        setDepartmentResources(data.sharePoints || [])
      } else {
        setDepartmentResources([])
      }
      
      setShowResourcesModal(true)
    } catch (error) {
      console.error('Error fetching SharePoint sites:', error)
      toast.error('Failed to load SharePoint sites')
    }
  }

  const handleManageMailboxes = async (department: Department) => {
    try {
      setSelectedDepartment(department)
      setResourceType('mailbox')
      
      // Fetch current mailboxes for this department
      const response = await fetch(`/api/departments/${department.id}/mailboxes`)
      if (response.ok) {
        const data = await response.json()
        setDepartmentResources(data.mailboxes || [])
      } else {
        setDepartmentResources([])
      }
      
      setShowResourcesModal(true)
    } catch (error) {
      console.error('Error fetching mailboxes:', error)
      toast.error('Failed to load mailboxes')
    }
  }

  const handleManageGroups = async (department: Department) => {
    try {
      setSelectedDepartment(department)
      setResourceType('group')
      
      // Fetch current groups for this department
      const response = await fetch(`/api/departments/${department.id}/groups`)
      if (response.ok) {
        const data = await response.json()
        setDepartmentResources(data.groups || [])
      } else {
        setDepartmentResources([])
      }
      
      setShowResourcesModal(true)
    } catch (error) {
      console.error('Error fetching groups:', error)
      toast.error('Failed to load groups')
    }
  }

  const handleDataChange = () => {
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading departments...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.office365Departments} from Office 365, {stats.localDepartments} local
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Departments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.inactiveDepartments} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPositions}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments with Users</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.departmentsWithUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSharePoints} SharePoint sites
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Tree Table */}
      <DepartmentsTreeTable
        departments={departments}
        users={users}
        onEditDepartment={handleEditDepartment}
        onDeleteDepartment={handleDeleteDepartment}
        onAssignUsers={handleAssignUsers}
        onManageSharePoints={handleManageSharePoints}
        onManageMailboxes={handleManageMailboxes}
        onManageGroups={handleManageGroups}
        onCreateDepartment={handleCreateDepartment}
        onDataChange={handleDataChange}
      />

      {/* Department Modal */}
      <DepartmentModal
        isOpen={showDepartmentModal}
        onClose={() => {
          setShowDepartmentModal(false)
          setSelectedDepartment(null)
        }}
        department={selectedDepartment}
        departments={departments}
        users={users}
        positions={positions}
        onSuccess={() => {
          setShowDepartmentModal(false)
          setSelectedDepartment(null)
          handleDataChange()
        }}
      />

      {/* Resources Modal */}
      {selectedDepartment && (
        <DepartmentResourcesModal
          isOpen={showResourcesModal}
          onClose={() => {
            setShowResourcesModal(false)
            setSelectedDepartment(null)
            setDepartmentResources([])
          }}
          departmentId={selectedDepartment.id}
          departmentName={selectedDepartment.name}
          resourceType={resourceType}
          resources={departmentResources}
          onSuccess={() => {
            setShowResourcesModal(false)
            setSelectedDepartment(null)
            setDepartmentResources([])
            handleDataChange()
          }}
        />
      )}
    </div>
  )
}
