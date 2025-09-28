"use client"

import { useState, useMemo } from "react"
import { Users, UserCheck, Edit, Trash2, Plus, Building, Mail, Briefcase, Search } from "lucide-react"
import { TreeDataTable, TreeNode } from "@/components/ui/tree-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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

interface UsersTreeTableProps {
  users: User[]
  departments: Department[]
  onEditUser: (user: User) => void
  onDeleteUser: (user: User) => void
  onAssignDepartments: (user: User) => void
  onAssignPositions: (user: User) => void
  onDataChange: () => void
}

export function UsersTreeTable({
  users,
  departments,
  onEditUser,
  onDeleteUser,
  onAssignDepartments,
  onAssignPositions,
  onDataChange
}: UsersTreeTableProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const treeData = useMemo(() => {
    console.log('UsersTreeTable - users data:', {
      totalUsers: users.length,
      sampleUser: users[0] ? {
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        hasUserDepartments: !!users[0].userDepartments,
        userDepartmentsCount: users[0].userDepartments?.length || 0,
        hasUserPositions: !!users[0].userPositions,
        userPositionsCount: users[0].userPositions?.length || 0,
        hasCount: !!users[0]._count,
        countData: users[0]._count
      } : null
    })
    
    // Filter users based on search query
    const filteredUsers = users.filter(user => {
      if (!searchQuery.trim()) return true
      
      const query = searchQuery.toLowerCase()
      
      // Get departments from positions for search
      const positions = user.userPositions || []
      const departments = positions.map((up: any) => up.position.department)
      const uniqueDepartments = departments.filter((dept: any, index: number, self: any[]) => 
        index === self.findIndex(d => d.id === dept.id)
      )
      
      return (
        user.name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.jobTitle?.toLowerCase().includes(query) ||
        uniqueDepartments.some(dept => 
          dept.name.toLowerCase().includes(query)
        ) ||
        user.userPositions?.some(up => 
          up.position.name.toLowerCase().includes(query)
        )
      )
    })
    
    // Create a flat list of users (no children since assignments are shown in columns)
    const treeNodes: TreeNode[] = filteredUsers.map(user => {
      // Derive departments from positions
      const positions = user.userPositions || []
      const departments = positions.map((up: any) => up.position.department)
      const uniqueDepartments = departments.filter((dept: any, index: number, self: any[]) => 
        index === self.findIndex(d => d.id === dept.id)
      )
      
      return {
        id: user.id,
        name: user.name || user.email,
        type: 'User',
        status: (user._count?.userPositions || 0) > 0 ? 'done' : 'pending',
        target: (user._count?.userPositions || 0),
        limit: 1,
        reviewer: (user._count?.userPositions || 0) > 0 
          ? `${(user._count?.userPositions || 0)} assignments`
          : 'No assignments',
        isExpanded: false,
        isSelected: selectedNodes.has(user.id),
        data: {
          ...user,
          // Add derived departments to the data
          derivedDepartments: uniqueDepartments,
          assignedUsers: [{
            id: user.id,
            name: user.name,
            email: user.email,
            jobTitle: user.jobTitle,
            image: user.tenantId ? `/api/users/${user.tenantId}/avatar` : null
          }]
        }
      }
    })

    return treeNodes.sort((a, b) => a.name.localeCompare(b.name))
  }, [users, departments, expandedNodes, selectedNodes, searchQuery])

  const handleToggleExpand = (id: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const handleToggleSelect = (id: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1">
            <UserCheck className="w-3 h-3 mr-1" />
            Assigned
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-1">
            <Users className="w-3 h-3 mr-1" />
            Unassigned
          </Badge>
        )
      default:
        return null
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'User',
      width: '20%',
      render: (node: TreeNode) => (
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-green-600" />
          <div>
            <div className="font-medium text-xs text-gray-900">{node.name}</div>
            {node.data?.email && (
              <div className="text-xs text-gray-500 mt-0.5">
                {node.data.email}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'departments',
      label: 'Departments',
      width: '20%',
      render: (node: TreeNode) => {
        if (node.type !== 'User') return <div className="text-xs text-gray-400">-</div>
        
        // Get departments from derived departments (based on positions)
        const departments = node.data?.derivedDepartments || []
        
        if (departments.length === 0) {
          return <div className="text-xs text-gray-400">No departments</div>
        }

        return (
          <div className="space-y-1">
            {departments.slice(0, 2).map((dept: any) => (
              <div key={dept.id} className="flex items-center gap-1">
                <Building className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-gray-700">
                  {dept.name}
                </span>
              </div>
            ))}
            {departments.length > 2 && (
              <div className="text-xs text-gray-500">
                +{departments.length - 2} more
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'positions',
      label: 'Positions',
      width: '20%',
      render: (node: TreeNode) => {
        if (node.type !== 'User') return <div className="text-xs text-gray-400">-</div>
        
        const positions = node.data?.userPositions || []
        if (positions.length === 0) {
          return <div className="text-xs text-gray-400">No positions</div>
        }

        return (
          <div className="space-y-1">
            {positions.slice(0, 2).map((up: any) => (
              <div key={up.id} className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-gray-700">
                  {up.position.name}
                </span>
              </div>
            ))}
            {positions.length > 2 && (
              <div className="text-xs text-gray-500">
                +{positions.length - 2} more
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'assignments',
      label: 'Assignments',
      width: '24%',
      render: (node: TreeNode) => {
        if (node.type !== 'User') return <div className="text-xs text-gray-400">-</div>
        return (
          <div className="text-xs text-gray-600">
            {node.target || 0} total
          </div>
        )
      }
    },
    {
      key: 'avatar',
      label: 'Avatar',
      width: '16%',
      render: (node: TreeNode) => {
        if (node.type !== 'User') return <div className="text-xs text-gray-400">-</div>
        
        const user = node.data
        if (!user) return <div className="text-xs text-gray-400">-</div>

        return (
          <div className="flex items-center">
            <Avatar className="w-6 h-6 border border-gray-200">
              <AvatarImage 
                src={user.isFromTenantSync && user.tenantId ? `/api/users/${user.tenantId}/avatar` : null} 
                alt={user.name || user.email}
                onLoad={() => {
                  console.log('Avatar loaded successfully for:', user.name || user.email)
                }}
                onError={(e) => {
                  console.log('Avatar failed to load for:', user.name || user.email, 'tenantId:', user.tenantId, 'isFromTenantSync:', user.isFromTenantSync)
                  e.currentTarget.style.display = 'none'
                }}
              />
              <AvatarFallback className="text-xs bg-black text-orange-700 font-medium">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )
      }
    }
  ]

  const actions = [
    {
      label: 'Assign Departments',
      onClick: (id: string) => {
        const user = users.find(u => u.id === id)
        if (user) onAssignDepartments(user)
      }
    },
    {
      label: 'Assign Positions',
      onClick: (id: string) => {
        const user = users.find(u => u.id === id)
        if (user) onAssignPositions(user)
      }
    },
    {
      label: 'Edit User',
      onClick: (id: string) => {
        const user = users.find(u => u.id === id)
        if (user) onEditUser(user)
      }
    },
    {
      label: 'Delete User',
      onClick: (id: string) => {
        const user = users.find(u => u.id === id)
        if (user) onDeleteUser(user)
      }
    }
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Users Management</h2>
            <Badge variant="outline" className="text-xs">
              {treeData.length} users
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64 text-xs"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 text-xs">
              <Building className="w-3 h-3" />
              Assign Departments
            </Button>
            <Button className="flex items-center gap-2 text-xs">
              <Plus className="w-3 h-3" />
              Add User
            </Button>
          </div>
        </div>

        {/* Tree Table */}
        <TreeDataTable
          data={treeData}
          onToggleExpand={handleToggleExpand}
          onToggleSelect={handleToggleSelect}
          onSelectAll={(selected) => {
            if (selected) {
              const allIds = treeData.flatMap(node => [
                node.id,
                ...(node.children || []).map(child => child.id)
              ])
              setSelectedNodes(new Set(allIds))
            } else {
              setSelectedNodes(new Set())
            }
          }}
          onRowAction={(id, action) => {
            const actionHandler = actions.find(a => a.label === action)
            if (actionHandler) {
              actionHandler.onClick(id)
            }
          }}
          actions={actions.map(a => a.label)}
          columns={columns}
        />
      </div>
    </>
  )
}
