"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, GripVertical, MoreHorizontal, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface TreeNode {
  id: string
  name: string
  type: string
  status: 'in-process' | 'done' | 'pending'
  target?: number
  limit?: number
  reviewer?: string
  children?: TreeNode[]
  isExpanded?: boolean
  isSelected?: boolean
  data?: Record<string, unknown> // Additional data for the row
}

interface TreeDataTableProps {
  data: TreeNode[]
  onToggleExpand: (id: string) => void
  onSelect?: (id: string, selected: boolean) => void
  onSelectAll?: (selected: boolean) => void
  onToggleSelect?: (id: string) => void
  onDragStart?: (id: string) => void
  onDragOver?: (id: string) => void
  onDrop?: (draggedId: string, targetId: string) => void
  onAction?: (action: string, id: string) => void
  onRowAction?: (id: string, action: string) => void
  columns: {
    key: string
    label: string
    width?: string
    render?: (node: TreeNode) => React.ReactNode
  }[]
  actions?: {
    label: string
    onClick: (id: string) => void
    icon?: React.ReactNode
  }[] | string[]
}

export function TreeDataTable({
  data,
  onToggleExpand,
  onSelect,
  onSelectAll,
  onToggleSelect,
  onDragStart,
  onDragOver,
  onDrop,
  onAction,
  onRowAction,
  columns,
  actions = []
}: TreeDataTableProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0
    const isExpanded = node.isExpanded || false
    const isSelected = node.isSelected || false

    const handleDragStart = (e: React.DragEvent) => {
      setDraggedId(node.id)
      onDragStart?.(node.id)
      e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      onDragOver?.(node.id)
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      if (draggedId && draggedId !== node.id) {
        onDrop?.(draggedId, node.id)
      }
      setDraggedId(null)
    }

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'in-process':
          return (
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
              In Process
            </Badge>
          )
        case 'done':
          return (
            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
              <Check className="w-3 h-3 mr-1" />
              Done
            </Badge>
          )
        case 'pending':
          return (
            <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">
              <X className="w-3 h-3 mr-1" />
              Pending
            </Badge>
          )
        default:
          return null
      }
    }

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center gap-3 py-2 px-3 hover:bg-gray-50 transition-colors",
            isSelected && "bg-blue-50",
            draggedId === node.id && "opacity-50"
          )}
          draggable={!!onDragStart}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
        >
          {/* Drag Handle */}
          {onDragStart && (
            <div className="flex flex-col gap-0.5 cursor-move">
              <GripVertical className="w-3 h-3 text-gray-400" />
            </div>
          )}

          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => {
              if (onSelect) {
                onSelect(node.id, !!checked)
              } else if (onToggleSelect) {
                onToggleSelect(node.id)
              }
            }}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />

          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-gray-200"
              onClick={() => onToggleExpand(node.id)}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          ) : (
            <div className="w-6" />
          )}

          {/* Columns */}
          {columns.map((column) => (
            <div
              key={column.key}
              className="flex-1 min-w-0"
              style={{ width: column.width }}
            >
              {column.render ? column.render(node) : (
                <span className="text-xs text-gray-700 truncate">
                  {node[column.key as keyof TreeNode] as string}
                </span>
              )}
            </div>
          ))}

          {/* Actions Menu */}
          {actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {actions.map((action, index) => {
                  const actionLabel = typeof action === 'string' ? action : action.label
                  const actionIcon = typeof action === 'string' ? null : action.icon
                  
                  return (
                    <DropdownMenuItem
                      key={index}
                      onClick={() => {
                        if (typeof action === 'string') {
                          onRowAction?.(node.id, action)
                        } else {
                          action.onClick(node.id)
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      {actionIcon}
                      {actionLabel}
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const allSelected = data.every(node => node.isSelected)
  const someSelected = data.some(node => node.isSelected)

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-3 py-2 px-3">
          {/* Select All Checkbox */}
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) {
                const input = el.querySelector('input') as HTMLInputElement
                if (input) input.indeterminate = someSelected && !allSelected
              }
            }}
            onCheckedChange={(checked) => onSelectAll?.(!!checked)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />

          {/* Column Headers */}
          {columns.map((column) => (
            <div
              key={column.key}
              className="flex-1 min-w-0 font-medium text-xs text-gray-600"
              style={{ width: column.width }}
            >
              {column.label}
            </div>
          ))}

          {/* Actions Header */}
          {actions.length > 0 && (
            <div className="w-8" />
          )}
        </div>
      </div>

      {/* Body */}
      <div className="divide-y divide-gray-200">
        {data.map((node) => renderTreeNode(node))}
      </div>
    </div>
  )
}
