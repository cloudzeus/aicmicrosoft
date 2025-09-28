"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, UserCheck, Loader2, Building, Mail, Briefcase } from "lucide-react"
import { UsersTreeTable } from "@/components/management/users-tree-table"
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
  userDepartments: Array<{
    id: string
    isPrimary: boolean
    assignedAt: Date
    department: {
      id: string
      name: string
      code: string
    }
  }>
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
  _count: {
    userDepartments: number
    userPositions: number
  }
}

interface Department {
  id: string
  name: string
  code: string
  description?: string | null
}

interface UsersManagementClientProps {
  initialUsers: User[]
  initialDepartments: Department[]
}

export function UsersManagementClient({ 
  initialUsers, 
  initialDepartments 
}: UsersManagementClientProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [departments, setDepartments] = useState<Department[]>(initialDepartments)
  const [stats, setStats] = useState({
    totalUsers: 0,
    assignedUsers: 0,
    unassignedUsers: 0,
    totalDepartments: 0,
    departmentsWithUsers: 0,
    totalAssignments: 0,
    office365Users: 0,
    localUsers: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch users with assignments
      const usersResponse = await fetch('/api/users?includeAssignments=true')
      if (!usersResponse.ok) throw new Error('Failed to fetch users')
      const usersData = await usersResponse.json()
      
      console.log('Users data received:', {
        totalUsers: usersData.users?.length || 0,
        sampleUser: usersData.users?.[0] ? {
          id: usersData.users[0].id,
          name: usersData.users[0].name,
          email: usersData.users[0].email,
          hasUserDepartments: !!usersData.users[0].userDepartments,
          userDepartmentsCount: usersData.users[0].userDepartments?.length || 0,
          hasUserPositions: !!usersData.users[0].userPositions,
          userPositionsCount: usersData.users[0].userPositions?.length || 0,
          hasCount: !!usersData.users[0]._count,
          countData: usersData.users[0]._count,
          userDepartments: usersData.users[0].userDepartments,
          userPositions: usersData.users[0].userPositions
        } : null
      })
      
      setUsers(usersData.users || [])

      // Fetch departments
      const departmentsResponse = await fetch('/api/departments')
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments')
      const departmentsData = await departmentsResponse.json()
      setDepartments(departmentsData.departments || [])

      // Calculate comprehensive stats
      const usersList = usersData.users || []
      const departmentsList = departmentsData.departments || []
      
      // User statistics
      const totalUsers = usersList.length
      const assignedUsers = usersList.filter(user => 
        (user._count?.userPositions || 0) > 0
      ).length
      const unassignedUsers = totalUsers - assignedUsers
      const totalAssignments = usersList.reduce((sum: number, user: User) => 
        sum + (user._count?.userPositions || 0), 0
      )
      
      // Department statistics (based on positions)
      const totalDepartments = departmentsList.length
      const departmentsWithUsers = departmentsList.filter(dept => 
        usersList.some(user => 
          user.userPositions?.some(up => up.position.department.id === dept.id)
        )
      ).length
      
      // Sync statistics
      const office365Users = usersList.filter(user => user.isFromTenantSync).length
      const localUsers = usersList.filter(user => !user.isFromTenantSync).length

      setStats({
        totalUsers,
        assignedUsers,
        unassignedUsers,
        totalDepartments,
        departmentsWithUsers,
        totalAssignments,
        office365Users,
        localUsers
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
    const totalUsers = initialUsers.length
    const assignedUsers = initialUsers.filter(user => 
      (user._count?.userPositions || 0) > 0
    ).length
    const unassignedUsers = totalUsers - assignedUsers
    const totalAssignments = initialUsers.reduce((sum: number, user: User) => 
      sum + (user._count?.userPositions || 0), 0
    )
    
    const totalDepartments = initialDepartments.length
    const departmentsWithUsers = initialDepartments.filter(dept => 
      initialUsers.some(user => 
        user.userPositions?.some(up => up.position.department.id === dept.id)
      )
    ).length
    
    const office365Users = initialUsers.filter(user => user.isFromTenantSync).length
    const localUsers = initialUsers.filter(user => !user.isFromTenantSync).length

    setStats({
      totalUsers,
      assignedUsers,
      unassignedUsers,
      totalDepartments,
      departmentsWithUsers,
      totalAssignments,
      office365Users,
      localUsers
    })
  }, [initialUsers, initialDepartments])

  const handleEditUser = (user: User) => {
    console.log('Edit user:', user)
    toast.info('Edit user functionality coming soon')
  }

  const handleDeleteUser = (user: User) => {
    console.log('Delete user:', user)
    toast.info('Delete user functionality coming soon')
  }

  const handleAssignDepartments = (user: User) => {
    console.log('Assign departments to user:', user)
    toast.info('Assign departments functionality coming soon')
  }

  const handleAssignPositions = (user: User) => {
    console.log('Assign positions to user:', user)
    toast.info('Assign positions functionality coming soon')
  }

  const handleDataChange = () => {
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.office365Users} from Office 365, {stats.localUsers} local
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assignedUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.unassignedUsers} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {stats.departmentsWithUsers} with users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Across all users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Tree Table */}
      <UsersTreeTable
        users={users}
        departments={departments}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        onAssignDepartments={handleAssignDepartments}
        onAssignPositions={handleAssignPositions}
        onDataChange={handleDataChange}
      />
    </div>
  )
}
