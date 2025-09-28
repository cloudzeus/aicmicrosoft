"use client"

import { useState, useMemo } from "react"
import { Building, UserCheck, Edit, Trash2, Plus, Database } from "lucide-react"
import { TreeDataTable, TreeNode } from "@/components/ui/tree-data-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserAssignmentModal } from "./user-assignment-modal"

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

interface PositionsTreeTableProps {
  positions: Position[]
  departments: Department[]
  users: User[]
  onEditPosition: (position: Position) => void
  onDeletePosition: (position: Position) => void
  onAssignUsers: (position: Position) => void
  onCreatePosition: () => void
  onCreateDepartment: () => void
  onDataChange: () => void
}

export function PositionsTreeTable({
  positions,
  departments,
  users,
  onEditPosition,
  onDeletePosition,
  onAssignUsers,
  onCreatePosition,
  onCreateDepartment,
  onDataChange
}: PositionsTreeTableProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)

  // Group positions by department
  const treeData = useMemo(() => {
    const departmentMap = new Map<string, Position[]>()
    
    positions.forEach(position => {
      const deptId = position.departmentId
      if (!departmentMap.has(deptId)) {
        departmentMap.set(deptId, [])
      }
      departmentMap.get(deptId)!.push(position)
    })

    const treeNodes: TreeNode[] = []
    
    departmentMap.forEach((deptPositions, deptId) => {
      const department = departments.find(d => d.id === deptId)
      if (!department) return

      // Aggregate all assigned users across all positions in this department
      const allDepartmentUsers = new Map<string, { id: string; name: string; email: string; image?: string; tenantId: string }>()
      deptPositions.forEach(position => {
        position.userPositions?.forEach(up => {
          if (!allDepartmentUsers.has(up.user.id)) {
            allDepartmentUsers.set(up.user.id, {
              id: up.user.id,
              name: up.user.name,
              email: up.user.email,
              jobTitle: up.user.jobTitle,
              image: up.user.tenantId ? `/api/users/${up.user.tenantId}/avatar` : null
            })
          }
        })
      })

      const departmentNode: TreeNode = {
        id: `dept-${deptId}`,
        name: department.name,
        type: 'Department',
        status: 'done',
        target: deptPositions.length,
        limit: deptPositions.length,
        reviewer: `${deptPositions.reduce((sum, p) => sum + p._count.userPositions, 0)} assigned`,
        isExpanded: expandedNodes.has(`dept-${deptId}`),
        isSelected: selectedNodes.has(`dept-${deptId}`),
        data: {
          assignedUsers: Array.from(allDepartmentUsers.values())
        },
        children: deptPositions.map(position => ({
          id: position.id,
          name: position.name,
          type: 'Position',
          status: position._count.userPositions > 0 ? 'done' : 'pending',
          target: position._count.userPositions,
          limit: 1,
          reviewer: position._count.userPositions > 0 
            ? `${position._count.userPositions} assigned`
            : 'Assign reviewer',
          isExpanded: false,
          isSelected: selectedNodes.has(position.id),
          data: {
            ...position,
            assignedUsers: position.userPositions?.map(up => ({
              id: up.user.id,
              name: up.user.name,
              email: up.user.email,
              jobTitle: up.user.jobTitle,
              image: up.user.tenantId ? `/api/users/${up.user.tenantId}/avatar` : null
            })) || []
          }
        }))
      }

      treeNodes.push(departmentNode)
    })

    return treeNodes
  }, [positions, departments, expandedNodes, selectedNodes])

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

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      const allIds = new Set<string>()
      const collectIds = (nodes: TreeNode[]) => {
        nodes.forEach(node => {
          allIds.add(node.id)
          if (node.children) {
            collectIds(node.children)
          }
        })
      }
      collectIds(treeData)
      setSelectedNodes(allIds)
    } else {
      setSelectedNodes(new Set())
    }
  }

  const handleAssignUsers = (position: Position) => {
    setSelectedPosition(position)
    setIsUserModalOpen(true)
  }

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false)
    setSelectedPosition(null)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 text-xs px-2 py-1">
            <Database className="w-3 h-3 mr-1" />
            Active
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-1">
            <Database className="w-3 h-3 mr-1" />
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
      label: 'Position',
      width: '30%',
      render: (node: TreeNode) => (
        <div className="flex items-center gap-2">
          {node.type === 'Department' ? (
            <Building className="w-3 h-3 text-blue-600" />
          ) : (
            <div className="w-3 h-3 rounded bg-gray-300" />
          )}
          <div>
            <div className="font-medium text-xs text-gray-900">{node.name}</div>
            {node.type === 'Position' && node.data?.description && (
              <div className="text-xs text-gray-500 mt-0.5">
                {node.data.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      width: '12%',
      render: (node: TreeNode) => (
        <span className="text-xs text-gray-600">
          {node.type === 'Department' ? 'Department' : 'Position'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (node: TreeNode) => getStatusBadge(node.status)
    },
    {
      key: 'assignments',
      label: 'Assignments',
      width: '12%',
      render: (node: TreeNode) => (
        <div className="text-xs text-gray-600">
          {node.target || 0} / {node.limit || 0}
        </div>
      )
    },
    {
      key: 'reviewer',
      label: 'Reviewer',
      width: '12%',
      render: (node: TreeNode) => (
        <div className="text-xs text-gray-600">
          {node.reviewer || 'Unassigned'}
        </div>
      )
    },
    {
      key: 'assignedUsers',
      label: 'Assigned Users',
      width: '20%',
      render: (node: TreeNode) => {
        const assignedUsers = node.data?.assignedUsers || []
        const maxVisible = 3
        const visibleUsers = assignedUsers.slice(0, maxVisible)
        const remainingCount = assignedUsers.length - maxVisible

        if (assignedUsers.length === 0) {
          return (
            <div className="text-xs text-gray-400">
              {node.type === 'Department' ? 'No users in department' : 'No users assigned'}
            </div>
          )
        }

        console.log('Rendering avatars for users:', visibleUsers.map(u => ({
          name: u.name,
          email: u.email,
          image: u.image,
          tenantId: u.tenantId
        })))

        return (
          <div className="flex items-center gap-1">
            {visibleUsers.map((user: { id: string; name: string; email: string; image?: string }, index: number) => (
              <Tooltip key={user.id}>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="w-6 h-6 border border-gray-200">
                      <AvatarImage 
                        src={user.image} 
                        alt={user.name || user.email}
                        onLoad={() => {
                          console.log('Avatar loaded successfully for:', user.name || user.email)
                        }}
                        onError={(e) => {
                          console.log('Avatar failed to load for:', user.name || user.email, 'URL:', user.image)
                          // Hide the image if it fails to load
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <AvatarFallback className="text-xs bg-black text-orange-700 font-medium">
                        {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white text-xs">
                  <p className="font-medium">{user.name || user.email}</p>
                  {user.jobTitle && (
                    <p className="text-gray-300">{user.jobTitle}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
            {remainingCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-xs text-orange-700 font-medium">
                    +{remainingCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-black text-white text-xs">
                  <p>+{remainingCount} more users</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )
      }
    }
  ]

  const actions = [
    {
      label: 'Assign Users',
      onClick: (id: string) => {
        const position = positions.find(p => p.id === id)
        if (position) {
          handleAssignUsers(position)
        }
      },
      icon: <UserCheck className="w-4 h-4" />
    },
    {
      label: 'Edit',
      onClick: (id: string) => {
        const position = positions.find(p => p.id === id)
        if (position) {
          onEditPosition(position)
        }
      },
      icon: <Edit className="w-4 h-4" />
    },
    {
      label: 'Delete',
      onClick: (id: string) => {
        const position = positions.find(p => p.id === id)
        if (position && !position.isFromTenantSync) {
          onDeletePosition(position)
        }
      },
      icon: <Trash2 className="w-4 h-4" />
    }
  ]

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Positions Management</h2>
            <Badge variant="outline" className="text-xs">
              {positions.length} positions
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onCreateDepartment} variant="outline" className="flex items-center gap-2 text-xs">
              <Building className="w-3 h-3" />
              Add Department
            </Button>
            <Button onClick={onCreatePosition} className="flex items-center gap-2 text-xs">
              <Plus className="w-3 h-3" />
              Add Position
            </Button>
          </div>
        </div>

        {/* Tree Table */}
        <TreeDataTable
          data={treeData}
          onToggleExpand={handleToggleExpand}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          columns={columns}
          actions={actions}
        />
      </div>

      {/* User Assignment Modal */}
      {selectedPosition && (
        <UserAssignmentModal
          isOpen={isUserModalOpen}
          onClose={handleCloseUserModal}
          positionId={selectedPosition.id}
          positionName={selectedPosition.name}
          department={{
            id: selectedPosition.departmentId,
            name: selectedPosition.department.name,
            code: selectedPosition.department.code,
            positions: [selectedPosition]
          }}
          assignedUsers={selectedPosition.userPositions || []}
          allUsers={users}
          onSuccess={() => {
            handleCloseUserModal()
            onDataChange() // Refresh data
          }}
        />
      )}
    </>
  )
}
