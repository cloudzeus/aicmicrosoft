"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FaCheckCircle, FaCircle, FaClock, FaExclamationTriangle, FaPlus, FaSync } from "react-icons/fa"
import { format } from "date-fns"

interface MicrosoftTodo {
  id: string
  title: string
  body: {
    content: string
    contentType: string
  } | null
  status: 'notStarted' | 'inProgress' | 'completed' | 'waitingOnOthers' | 'deferred'
  importance: 'low' | 'normal' | 'high'
  dueDateTime: {
    dateTime: string
    timeZone: string
  } | null
  createdDateTime: string
  lastModifiedDateTime: string
  isReminderOn: boolean
  reminderDateTime: {
    dateTime: string
    timeZone: string
  } | null
}

interface TodosListProps {
  userId: string
  initialTodos?: any[]
}

const statusConfig = {
  notStarted: { color: 'bg-gray-100 text-gray-800', label: 'Not Started' },
  inProgress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
  completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
  waitingOnOthers: { color: 'bg-yellow-100 text-yellow-800', label: 'Waiting' },
  deferred: { color: 'bg-orange-100 text-orange-800', label: 'Deferred' },
}

const importanceConfig = {
  low: { color: 'bg-gray-100 text-gray-800', icon: FaCircle },
  normal: { color: 'bg-blue-100 text-blue-800', icon: FaCircle },
  high: { color: 'bg-red-100 text-red-800', icon: FaExclamationTriangle },
}

export function TodosList({ userId, initialTodos = [] }: TodosListProps) {
  const [todos, setTodos] = useState<MicrosoftTodo[]>(initialTodos)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTodos = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/microsoft-todos')
      if (!response.ok) {
        throw new Error('Failed to fetch Microsoft To Do items')
      }
      const data = await response.json()
      setTodos(data.todos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch todos')
    } finally {
      setLoading(false)
    }
  }

  const toggleTodo = async (todoId: string, completed: boolean) => {
    try {
      const newStatus = completed ? 'completed' : 'notStarted'
      const response = await fetch(`/api/microsoft-todos/${todoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update todo')
      }

      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status: newStatus } : todo
      ))
    } catch (err) {
      console.error('Error updating todo:', err)
      // Still update local state for better UX
      const newStatus = completed ? 'completed' : 'notStarted'
      setTodos(prev => prev.map(todo => 
        todo.id === todoId ? { ...todo, status: newStatus } : todo
      ))
    }
  }

  useEffect(() => {
    // Only fetch if we don't have initial todos
    if (initialTodos.length === 0) {
      fetchTodos()
    }
  }, [userId, initialTodos.length])

  const completedTodos = todos.filter(todo => todo.status === 'completed')
  const pendingTodos = todos.filter(todo => todo.status !== 'completed')
  const urgentTodos = pendingTodos.filter(todo => todo.importance === 'high')
  const overdueTodos = pendingTodos.filter(todo => 
    todo.dueDateTime && new Date(todo.dueDateTime.dateTime) < new Date()
  )

  if (loading) {
    return (
      <Card className="border border-[#e5e7eb] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
            <FaCheckCircle className="w-4 h-4 text-[#5e5e5e]" />
            My Todos
          </CardTitle>
          <CardDescription className="text-[12px]">Loading your assigned tasks...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border border-[#e5e7eb] shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
            <FaCheckCircle className="w-4 h-4 text-[#5e5e5e]" />
            My Todos
          </CardTitle>
          <CardDescription className="text-[12px]">Error loading todos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button onClick={fetchTodos} size="sm" variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-[#e5e7eb] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[15px] font-semibold text-[#1f2328]">
              <FaCheckCircle className="w-4 h-4 text-[#5e5e5e]" />
              Microsoft To Do
            </CardTitle>
            <CardDescription className="text-[12px]">
              {todos.length} total • {pendingTodos.length} pending • {completedTodos.length} completed
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs" onClick={fetchTodos}>
              <FaSync className="w-3 h-3 mr-1" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" className="text-xs" asChild>
              <a href="https://to-do.office.com" target="_blank" rel="noopener noreferrer">
                <FaPlus className="w-3 h-3 mr-1" />
                Add Todo
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {todos.length === 0 ? (
          <div className="text-center py-6">
            <FaCheckCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {error ? 'Microsoft To Do requires re-authentication' : 'No tasks found'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {error ? 'Please sign out and sign in again to refresh permissions' : 'You\'re all caught up!'}
            </p>
            {error && (
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={fetchTodos}>
                  <FaSync className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <a href="/auth/signout">
                    Sign Out & Re-authenticate
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {/* Urgent/Overdue todos first */}
            {urgentTodos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-red-600 flex items-center gap-1">
                  <FaExclamationTriangle className="w-3 h-3" />
                  Urgent ({urgentTodos.length})
                </h4>
                {urgentTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                ))}
              </div>
            )}

            {overdueTodos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-orange-600 flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  Overdue ({overdueTodos.length})
                </h4>
                {overdueTodos.map(todo => (
                  <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                ))}
              </div>
            )}

            {/* Other pending todos */}
            {pendingTodos.filter(todo => todo.importance !== 'high' && (!todo.dueDateTime || new Date(todo.dueDateTime.dateTime) >= new Date())).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-600">Pending</h4>
                {pendingTodos
                  .filter(todo => todo.importance !== 'high' && (!todo.dueDateTime || new Date(todo.dueDateTime.dateTime) >= new Date()))
                  .map(todo => (
                    <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                  ))}
              </div>
            )}

            {/* Completed todos (collapsed by default) */}
            {completedTodos.length > 0 && (
              <details className="space-y-2">
                <summary className="text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800">
                  Completed ({completedTodos.length})
                </summary>
                <div className="space-y-2 ml-4">
                  {completedTodos.map(todo => (
                    <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} />
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TodoItem({ todo, onToggle }: { todo: MicrosoftTodo; onToggle: (id: string, completed: boolean) => void }) {
  const ImportanceIcon = importanceConfig[todo.importance].icon
  const isCompleted = todo.status === 'completed'
  const isOverdue = todo.dueDateTime && new Date(todo.dueDateTime.dateTime) < new Date() && !isCompleted

  return (
    <div className={`flex items-start space-x-3 p-2 rounded-lg border ${
      isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
    } ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`text-sm font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
            {todo.title}
          </h4>
          <Badge className={`text-xs ${statusConfig[todo.status].color}`}>
            {statusConfig[todo.status].label}
          </Badge>
          <Badge className={`text-xs ${importanceConfig[todo.importance].color}`}>
            <ImportanceIcon className="w-2 h-2 mr-1" />
            {todo.importance}
          </Badge>
        </div>
        {todo.body?.content && (
          <p className={`text-xs text-gray-600 mb-1 ${isCompleted ? 'line-through' : ''}`}>
            {todo.body.content.replace(/<[^>]*>/g, '')} {/* Strip HTML tags */}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {todo.dueDateTime && (
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
              <FaClock className="w-2 h-2" />
              {format(new Date(todo.dueDateTime.dateTime), 'MMM d, yyyy')}
            </span>
          )}
          {todo.isReminderOn && todo.reminderDateTime && (
            <span className="flex items-center gap-1 text-blue-600">
              <FaClock className="w-2 h-2" />
              Reminder: {format(new Date(todo.reminderDateTime.dateTime), 'MMM d, h:mm a')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
