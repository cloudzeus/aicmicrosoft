"use client"

import { useState, useMemo } from "react"
import { Building, Edit, Trash2, Plus, Users, Briefcase, Share, Search } from "lucide-react"
import { TreeDataTable, TreeNode } from "@/components/ui/tree-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
}

interface DepartmentsTreeTableProps {
  departments: Department[]
  users: User[]
  onEditDepartment: (department: Department) => void
  onDeleteDepartment: (department: Department) => void
  onAssignUsers: (department: Department) => void
  onManageSharePoints: (department: Department) => void
  onDataChange: () => void
}

export function DepartmentsTreeTable({
  departments,
  users,
  onEditDepartment,
  onDeleteDepartment,
  onAssignUsers,
  onManageSharePoints,
  onDataChange
}: DepartmentsTreeTableProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  const treeData = useMemo(() => {
    console.log('DepartmentsTreeTable - departments data:', {
      totalDepartments: departments.length,
      sampleDepartment: departments[0] ? {
        id: departments[0].id,
        name: departments[0].name,
        code: departments[0].code,
        hasPositions: !!departments[0].positions,
        positionsCount: departments[0].positions?.length || 0,
        hasCount: !!departments[0]._count,
        countData: departments[0]._count
      } : null
    })
    
    // Filter departments based on search query
    const filteredDepartments = departments.filter(dept => {
      if (!searchQuery.trim()) return true
      
      const query = searchQuery.toLowerCase()
      return (
        dept.name?.toLowerCase().includes(query) ||
        dept.code?.toLowerCase().includes(query) ||
        dept.description?.toLowerCase().includes(query) ||
        dept.manager?.name?.toLowerCase().includes(query) ||
        dept.positions?.some(pos => 
          pos.name.toLowerCase().includes(query)
        )
      )
    })
    
    // Create a flat list of departments (no children since assignments are shown in columns)
    const treeNodes: TreeNode[] = filteredDepartments.map(department => {
      // Get users assigned to this department through positions
      const departmentUsers = users.filter((user: any) => 
        user.userPositions?.some((up: any) => 
          up.position.department.id === department.id
        )
      )
      
      return {
        id: department.id,
        name: department.name,
        type: 'Department',
        status: (department._count?.positions || 0) > 0 ? 'done' : 'pending',
        target: (department._count?.positions || 0),
        limit: 1,
        reviewer: (department._count?.positions || 0) > 0 
          ? `${(department._count?.positions || 0)} positions`
          : 'No positions',
        isExpanded: false,
        isSelected: selectedNodes.has(department.id),
        data: {
          ...department,
          // Add assigned users to the data
          assignedUsers: departmentUsers.map(user => ({
            id: user.id,
            name: user.name,
            email: user.email,
            jobTitle: user.jobTitle,
            image: user.tenantId ? `/api/users/${user.tenantId}/avatar` : null
          }))
        }
      }
    })

    return treeNodes.sort((a, b) => a.name.localeCompare(b.name))
  }, [departments, users, selectedNodes, searchQuery])

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
            <Building className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-1">
            <Building className="w-3 h-3 mr-1" />
            Inactive
          </Badge>
        )
      default:
        return null
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Department',
      width: '25%',
      render: (node: TreeNode) => (
        <div className="flex items-center gap-2">
          <Building className="w-3 h-3 text-blue-600" />
          <div>
            <div className="font-medium text-xs text-gray-900">{node.name}</div>
            {node.data?.code && (
              <div className="text-xs text-gray-500 mt-0.5">
                {node.data.code}
              </div>
            )}
            {node.data?.description && (
              <div className="text-xs text-gray-400 mt-0.5">
                {node.data.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'manager',
      label: 'Manager',
      width: '20%',
      render: (node: TreeNode) => {
        if (node.type !== 'Department') return <div className="text-xs text-gray-400">-</div>
        
        const manager = node.data?.manager
        if (!manager) {
          return <div className="text-xs text-gray-400">No manager</div>
        }

        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-5 h-5 border border-gray-200">
              <AvatarImage 
                src={manager.tenantId ? `/api/users/${manager.tenantId}/avatar` : null} 
                alt={manager.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <AvatarFallback className="text-xs bg-black text-orange-700 font-medium">
                {manager.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xs text-gray-700">{manager.name}</div>
              {manager.jobTitle && (
                <div className="text-xs text-gray-500">{manager.jobTitle}</div>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'positions',
      label: 'Positions',
      width: '20%',
      render: (node: TreeNode) => {
        if (node.type !== 'Department') return <div className="text-xs text-gray-400">-</div>
        
        const positions = node.data?.positions || []
        if (positions.length === 0) {
          return <div className="text-xs text-gray-400">No positions</div>
        }

        return (
          <div className="space-y-1">
            {positions.slice(0, 2).map((pos: { id: string; name: string }) => (
              <div key={pos.id} className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-purple-600" />
                <span className="text-xs text-gray-700">
                  {pos.name}
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
      key: 'assignedUsers',
      label: 'Assigned Users',
      width: '20%',
      render: (node: TreeNode) => {
        if (node.type !== 'Department') return <div className="text-xs text-gray-400">-</div>
        
        const assignedUsers = node.data?.assignedUsers || []
        if (assignedUsers.length === 0) {
          return <div className="text-xs text-gray-400">No users</div>
        }

        return (
          <div className="flex items-center -space-x-1">
            {assignedUsers.slice(0, 3).map((user: { id: string; name: string; email: string; image?: string }, index: number) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <Avatar className="w-6 h-6 border-2 border-white">
                    <AvatarImage 
                      src={user.image} 
                      alt={user.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <AvatarFallback className="text-xs bg-black text-orange-700 font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white text-xs">
                  <div>
                    <div className="font-medium">{user.name || user.email}</div>
                    {user.jobTitle && (
                      <div className="text-gray-300">{user.jobTitle}</div>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}
            {assignedUsers.length > 3 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-6 h-6 rounded-full bg-black text-orange-700 text-xs font-medium flex items-center justify-center border-2 border-white">
                    +{assignedUsers.length - 3}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white text-xs">
                  <div>
                    <div className="font-medium">+{assignedUsers.length - 3} more users</div>
                    <div className="text-gray-300">
                      {assignedUsers.slice(3).map((user: { name?: string; email: string }) => user.name || user.email).join(', ')}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      }
    },
    {
      key: 'assignments',
      label: 'Assignments',
      width: '15%',
      render: (node: TreeNode) => {
        if (node.type !== 'Department') return <div className="text-xs text-gray-400">-</div>
        return (
          <div className="text-xs text-gray-600">
            {node.target || 0} positions
          </div>
        )
      }
    }
  ]

  const actions = [
    {
      label: 'Assign Users',
      onClick: (id: string) => {
        const department = departments.find(d => d.id === id)
        if (department) onAssignUsers(department)
      }
    },
    {
      label: 'Manage SharePoint',
      onClick: (id: string) => {
        const department = departments.find(d => d.id === id)
        if (department) onManageSharePoints(department)
      }
    },
    {
      label: 'Edit Department',
      onClick: (id: string) => {
        const department = departments.find(d => d.id === id)
        if (department) onEditDepartment(department)
      }
    },
    {
      label: 'Delete Department',
      onClick: (id: string) => {
        const department = departments.find(d => d.id === id)
        if (department) onDeleteDepartment(department)
      }
    }
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Departments Management</h2>
            <Badge variant="outline" className="text-xs">
              {treeData.length} departments
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <Input
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-64 text-xs"
              />
            </div>
            <Button className="flex items-center gap-2 text-xs">
              <Plus className="w-3 h-3" />
              Add Department
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
