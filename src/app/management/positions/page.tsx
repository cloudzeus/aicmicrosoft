"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Briefcase } from "lucide-react"
import { PositionModal } from "@/components/management/position-modal"
import { PositionsTreeTable } from "@/components/management/positions-tree-table"
import { AppLayout } from "@/components/layout/app-layout"
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
    manager?: {
      id: string
      name: string
      email: string
    } | null
  }
  userPositions: Array<{
    id: string
    assignedAt: Date
    user: {
      id: string
      name: string | null
      email: string
      jobTitle?: string | null
    }
  }>
  _count: {
    userPositions: number
  }
}

interface Department {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  name: string | null
  email: string
  jobTitle?: string | null
  role: string
}

interface Stats {
  totalPositions: number
  assignedPositions: number
  unassignedPositions: number
  totalAssignments: number
  totalDepartments: number
  departmentsWithPositions: number
  totalUsers: number
  assignedUsers: number
  unassignedUsers: number
  office365Positions: number
  localPositions: number
  office365Users: number
  localUsers: number
}

export default function PositionsManagementPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<Stats>({
    totalPositions: 0,
    assignedPositions: 0,
    unassignedPositions: 0,
    totalAssignments: 0,
    totalDepartments: 0,
    departmentsWithPositions: 0,
    totalUsers: 0,
    assignedUsers: 0,
    unassignedUsers: 0,
    office365Positions: 0,
    localPositions: 0,
    office365Users: 0,
    localUsers: 0
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch positions with user assignments
      const positionsResponse = await fetch('/api/positions?includeUsers=true')
      if (!positionsResponse.ok) throw new Error('Failed to fetch positions')
      const positionsData = await positionsResponse.json()
      setPositions(positionsData.positions || [])

      // Fetch departments for position creation
      const departmentsResponse = await fetch('/api/departments')
      if (!departmentsResponse.ok) throw new Error('Failed to fetch departments')
      const departmentsData = await departmentsResponse.json()
      setDepartments(departmentsData.departments || [])

      // Fetch users for assignment (try Graph API first, fallback to local)
      let usersData = { users: [] }
      try {
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          usersData = await usersResponse.json()
          console.log('Fetched users from Graph API:', usersData.users?.length || 0, 'users')
          console.log('Sample users:', usersData.users?.slice(0, 3).map((u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email })))
        } else {
          throw new Error('Graph API failed')
        }
      } catch (error) {
        console.log('Graph API failed, trying local users:', error)
        const localUsersResponse = await fetch('/api/users/local')
        if (localUsersResponse.ok) {
          usersData = await localUsersResponse.json()
          console.log('Fetched local users:', usersData.users?.length || 0, 'users')
          console.log('Sample local users:', usersData.users?.slice(0, 3).map((u: { id: string; name: string; email: string }) => ({ id: u.id, name: u.name, email: u.email })))
        } else {
          console.error('Both Graph API and local users failed')
        }
      }
      setUsers(usersData.users || [])

      // Calculate comprehensive stats
      const positions = positionsData.positions || []
      const departments = departmentsData.departments || []
      const users = usersData.users || []
      
      // Position statistics
      const totalPositions = positions.length
      const assignedPositions = positions.filter(pos => pos._count?.userPositions > 0).length
      const unassignedPositions = totalPositions - assignedPositions
      const totalAssignments = positions.reduce((sum: number, pos: Position) => sum + (pos._count?.userPositions || 0), 0)
      
      // Department statistics
      const uniqueDepartments = new Set(positions.map((pos: Position) => pos.departmentId)).size
      const departmentsWithPositions = departments.filter(dept => 
        positions.some(pos => pos.departmentId === dept.id)
      ).length
      
      // User statistics
      const totalUsers = users.length
      const assignedUsers = new Set(
        positions.flatMap(pos => 
          pos.userPositions?.map(up => up.user.id) || []
        )
      ).size
      const unassignedUsers = totalUsers - assignedUsers
      
      setStats({
        totalPositions,
        assignedPositions,
        unassignedPositions,
        totalAssignments,
        totalDepartments: uniqueDepartments,
        departmentsWithPositions,
        totalUsers,
        assignedUsers,
        unassignedUsers,
        office365Positions: 0,
        localPositions: 0,
        office365Users: 0,
        localUsers: 0
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

  const handleOpenModal = (position?: Position) => {
    setSelectedPosition(position || null)
    setIsModalOpen(true)
  }

  const handleOpenDepartmentModal = () => {
    // Navigate to departments page or open department modal
    router.push('/management/departments')
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedPosition(null)
  }

  const handleModalSuccess = () => {
    fetchData() // Refresh the data
  }

  const handleDelete = async (position: Position) => {
    if (position.isFromTenantSync) {
      toast.error("Cannot delete Office 365 synced positions")
      return
    }

    if (!confirm(`Are you sure you want to delete "${position.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/positions/${position.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete position")
      }

      toast.success("Position deleted successfully")
      fetchData() // Refresh the data
    } catch (error) {
      console.error("Error deleting position:", error)
      toast.error(error instanceof Error ? error.message : "Failed to delete position")
    }
  }

  if (isLoading) {
    return (
      <AppLayout 
        pageTitle="Positions Management" 
        pageDescription="Manage positions and user assignments"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-pulse" />
            <p className="text-gray-500">Loading positions...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      pageTitle="Positions Management" 
      pageDescription="Manage positions and user assignments"
    >
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Positions Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalPositions}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-600">{stats.assignedPositions} assigned</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-orange-600">{stats.unassignedPositions} unassigned</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Users Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalUsers}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-600">{stats.assignedUsers} assigned</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-orange-600">{stats.unassignedUsers} unassigned</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Departments Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Departments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalDepartments}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-green-600">{stats.departmentsWithPositions} with positions</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{stats.totalDepartments - stats.departmentsWithPositions} empty</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Assignments Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.totalAssignments}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Total user-position links</span>
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Tree Table */}
        <PositionsTreeTable
          positions={positions}
          departments={departments}
          users={users}
          onEditPosition={handleOpenModal}
          onDeletePosition={handleDelete}
          onAssignUsers={(position) => {
            // This will be handled by the tree table component
          }}
          onCreatePosition={() => handleOpenModal()}
          onCreateDepartment={handleOpenDepartmentModal}
          onDataChange={fetchData}
        />

        {/* Position Modal */}
        <PositionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          position={selectedPosition}
          departments={departments}
          onSuccess={handleModalSuccess}
        />
      </div>
    </AppLayout>
  )
}