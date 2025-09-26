"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FaUsers, FaSearch, FaTimes, FaUser } from "react-icons/fa"

interface User {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
  officeLocation?: string
}

interface SmartAttendeesInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SmartAttendeesInput({ 
  value, 
  onChange, 
  placeholder = "Type email addresses or @ to search users...",
  className = ""
}: SmartAttendeesInputProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [cursorPosition, setCursorPosition] = useState(0)
  const [showAtTrigger, setShowAtTrigger] = useState(false)
  const [atPosition, setAtPosition] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // Fetch users from tenant
  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  // Parse attendees from value string
  const parseAttendees = useCallback((value: string) => {
    return value.split(',').map(email => email.trim()).filter(email => email.length > 0)
  }, [])

  // Convert attendees back to string
  const attendeesToString = useCallback((attendees: string[]) => {
    return attendees.join(', ')
  }, [])

  // Check if cursor is after @ symbol
  const checkAtTrigger = useCallback((inputValue: string, cursorPos: number) => {
    const beforeCursor = inputValue.substring(0, cursorPos)
    const lastAt = beforeCursor.lastIndexOf('@')
    
    if (lastAt !== -1) {
      const afterAt = beforeCursor.substring(lastAt + 1)
      // Check if there's no space or comma after @
      if (!afterAt.includes(' ') && !afterAt.includes(',')) {
        setShowAtTrigger(true)
        setAtPosition(lastAt)
        setSearchTerm(afterAt)
        return true
      }
    }
    
    setShowAtTrigger(false)
    return false
  }, [])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    setCursorPosition(cursorPos)
    onChange(inputValue)
    
    checkAtTrigger(inputValue, cursorPos)
  }, [onChange, checkAtTrigger])

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showUserList) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, filteredUsers.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          selectUser(filteredUsers[selectedIndex])
        }
        break
      case 'Escape':
        setShowUserList(false)
        setSelectedIndex(-1)
        break
      case 'Tab':
        if (selectedIndex >= 0 && selectedIndex < filteredUsers.length) {
          e.preventDefault()
          selectUser(filteredUsers[selectedIndex])
        }
        break
    }
  }, [showUserList, filteredUsers, selectedIndex])

  // Select a user
  const selectUser = useCallback((user: User) => {
    const attendees = parseAttendees(value)
    const email = user.mail || user.userPrincipalName
    
    if (!attendees.includes(email)) {
      // Replace the @trigger part with the selected user
      const beforeAt = value.substring(0, atPosition)
      const afterTrigger = value.substring(cursorPosition)
      const newValue = beforeAt + email + ', ' + afterTrigger
      
      onChange(newValue)
      setShowUserList(false)
      setShowAtTrigger(false)
      setSelectedIndex(-1)
      
      // Focus back to input after the email
      setTimeout(() => {
        if (inputRef.current) {
          const newPosition = beforeAt.length + email.length + 2
          inputRef.current.setSelectionRange(newPosition, newPosition)
        }
      }, 0)
    }
  }, [value, atPosition, cursorPosition, onChange, parseAttendees])

  // Remove an attendee
  const removeAttendee = useCallback((emailToRemove: string) => {
    const attendees = parseAttendees(value)
    const filteredAttendees = attendees.filter(email => email !== emailToRemove)
    onChange(attendeesToString(filteredAttendees))
  }, [value, onChange, parseAttendees, attendeesToString])

  // Filter users based on search term
  useEffect(() => {
    if (showAtTrigger && searchTerm) {
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.mail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userPrincipalName?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10)
      
      setFilteredUsers(filtered)
      setSelectedIndex(-1)
    }
  }, [users, searchTerm, showAtTrigger])

  // Show user list when @ trigger is active
  useEffect(() => {
    setShowUserList(showAtTrigger && filteredUsers.length > 0)
  }, [showAtTrigger, filteredUsers])

  // Load users on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listRef.current && 
        !listRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowUserList(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const attendees = parseAttendees(value)

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Attendee badges */}
      {attendees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attendees.map((email, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              <FaUser className="w-3 h-3" />
              {email}
              <button
                type="button"
                onClick={() => removeAttendee(email)}
                className="ml-1 hover:text-red-500"
              >
                <FaTimes className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pr-10"
        />
        
        {/* User list dropdown */}
        {showUserList && (
          <div
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${
                  index === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
                onClick={() => selectUser(user)}
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FaUsers className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {user.displayName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user.mail || user.userPrincipalName}
                  </div>
                  {user.jobTitle && (
                    <div className="text-xs text-gray-400 truncate">
                      {user.jobTitle}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div className="p-3 text-sm text-gray-500 text-center">
                No users found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>💡 <strong>Tip:</strong> Type @ to search and select users from your organization</div>
        <div>📧 You can also type email addresses directly, separated by commas</div>
      </div>
    </div>
  )
}
