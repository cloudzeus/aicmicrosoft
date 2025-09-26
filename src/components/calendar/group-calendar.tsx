"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar"
import moment from "moment"
import { FaCalendarAlt, FaUsers, FaClock, FaUser, FaBuilding, FaChevronLeft, FaChevronRight } from "react-icons/fa"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar-styles.css"

const localizer = momentLocalizer(moment)

interface User {
  id: string
  displayName: string
  mail: string
  userPrincipalName?: string
  jobTitle?: string
  department?: string
  officeLocation?: string
}

interface GroupEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource: {
    user: User
    showAs: string
    location?: string
    isOnlineMeeting?: boolean
  }
}

interface GroupCalendarProps {
  selectedUsers: User[]
  onUserSelect: (users: User[]) => void
}

export function GroupCalendar({ selectedUsers, onUserSelect }: GroupCalendarProps) {
  const [users, setUsers] = useState<User[]>([])
  const [events, setEvents] = useState<GroupEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [errorMessages, setErrorMessages] = useState<string[]>([])

  // Fetch users from tenant
  const fetchUsers = useCallback(async () => {
    try {
      console.log('Fetching users from tenant...')
      const response = await fetch('/api/users', {
        credentials: 'include'
      })
      console.log('Users API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Users fetched:', data.users?.length || 0)
        setUsers(data.users || [])
      } else {
        const errorData = await response.json()
        console.error('Error fetching users:', errorData)
        if (response.status === 401) {
          alert('Please sign in first to access the group calendar. Go to the dashboard and sign in with Microsoft 365.')
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }, [])

  // Compute visible date range based on view and date
  const getRangeISO = useCallback(() => {
    const current = new Date(date)
    let rangeStart = new Date(current)
    let rangeEnd = new Date(current)
    if (view === Views.DAY) {
      rangeStart.setHours(0, 0, 0, 0)
      rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeEnd.getDate() + 1)
    } else if (view === Views.WEEK) {
      const day = current.getDay()
      const diffToMonday = (day + 6) % 7
      rangeStart.setDate(current.getDate() - diffToMonday)
      rangeStart.setHours(0, 0, 0, 0)
      rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeEnd.getDate() + 7)
    } else if (view === Views.MONTH) {
      rangeStart = new Date(current.getFullYear(), current.getMonth(), 1)
      rangeEnd = new Date(current.getFullYear(), current.getMonth() + 1, 1)
    } else {
      // Agenda or other views: 30-day window
      rangeStart.setHours(0, 0, 0, 0)
      rangeEnd = new Date(rangeStart)
      rangeEnd.setDate(rangeEnd.getDate() + 30)
    }
    return {
      startISO: rangeStart.toISOString(),
      endISO: rangeEnd.toISOString()
    }
  }, [date, view])

  // Fetch calendar events for selected users (free/busy)
  const fetchGroupEvents = useCallback(async () => {
    if (selectedUsers.length === 0) {
      setEvents([])
      setErrorMessages([])
      return
    }

    console.log(`Fetching events for ${selectedUsers.length} selected users`)
    setLoading(true)
    setErrorMessages([])
    try {
      const { startISO, endISO } = getRangeISO()
      const promises = selectedUsers.map(async (user) => {
        try {
          // Validate user data before making API call
          if (!user.id || !user.displayName) {
            console.error(`Invalid user data, skipping:`, user)
            return []
          }
          
          // Use userPrincipalName or mail if available for getSchedule
          const scheduleKey = user.userPrincipalName || user.mail || user.id
          console.log(`Fetching free/busy for user: ${user.displayName} (${scheduleKey}) range ${startISO} - ${endISO}`)
          const params = new URLSearchParams({
            userId: scheduleKey,
            start: startISO,
            end: endISO
          })
          const response = await fetch(`/api/calendar/events?${params.toString()}`, {
            credentials: 'include'
          })
          console.log(`Events API response for ${user.displayName}:`, response.status, response.statusText)
          
          if (response.ok) {
            const responseText = await response.text()
            console.log(`Raw response for ${user.displayName}:`, responseText)
            
            // Handle empty response
            if (!responseText || responseText.trim() === '' || responseText.trim() === '{}') {
              console.warn(`Empty response for ${user.displayName}`)
              return []
            }
            
            const data = JSON.parse(responseText)
            console.log(`Parsed response data for ${user.displayName}:`, data)
            console.log(`Found ${data.events?.length || 0} events for ${user.displayName}`)
            
            // Handle successful response with no events
            if (data.events && Array.isArray(data.events)) {
              if (data.events.length === 0) {
                console.log(`No events found for ${user.displayName} - this is normal`)
                return []
              }
              return data.events.map((event: { 
                id: string; 
                start: { dateTime: string }; 
                end: { dateTime: string };
                showAs?: string;
                location?: { displayName?: string };
              }) => ({
                id: `${user.id}-${event.id}`,
                title: `${user.displayName}: BUSY`,
                start: new Date(event.start.dateTime),
                end: new Date(event.end.dateTime),
                allDay: false,
                resource: {
                  user,
                  showAs: event.showAs || 'busy',
                  location: event.location?.displayName,
                  isOnlineMeeting: false
                }
              }))
            } else {
              console.warn(`No events array found for ${user.displayName}, response:`, data)
              if (data.warning) {
                console.warn(`Warning from server: ${data.warning}`)
              }
              return []
            }
          } else {
            const errorText = await response.text()
            console.error(`Error fetching events for ${user.displayName}:`, {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText
            })
            
            // Try to parse as JSON if possible
            try {
              const errorData = JSON.parse(errorText)
              console.error(`Parsed error data for ${user.displayName}:`, errorData)
              
              // Show user-friendly error messages
              let errorMessage = ''
              if (response.status === 403) {
                errorMessage = `⚠️ Cannot access ${user.displayName}'s calendar - they may need to share it with you`
                console.warn(`⚠️ Permission denied: Cannot access ${user.displayName}'s calendar. They may need to share it with you.`)
              } else if (response.status === 404) {
                errorMessage = `⚠️ ${user.displayName} not found in your organization`
                console.warn(`⚠️ User not found: ${user.displayName} may not exist in your organization.`)
              } else {
                errorMessage = `⚠️ Failed to load ${user.displayName}'s calendar: ${errorData.details || errorText}`
                console.warn(`⚠️ Failed to load ${user.displayName}'s calendar: ${errorData.details || errorText}`)
              }
              
              setErrorMessages(prev => [...prev, errorMessage])
            } catch {
              console.error(`Raw error text for ${user.displayName}:`, errorText)
              const errorMessage = `⚠️ Failed to load ${user.displayName}'s calendar: ${response.status} ${response.statusText}`
              console.warn(errorMessage)
              setErrorMessages(prev => [...prev, errorMessage])
            }
          }
        } catch (error) {
          console.error(`Error fetching events for ${user.displayName}:`, error)
        }
        return []
      })

      const allEvents = await Promise.all(promises)
      const flatEvents = allEvents.flat()
      console.log(`Total events loaded: ${flatEvents.length}`)
      setEvents(flatEvents)
    } catch (error) {
      console.error('Error fetching group events:', error)
    } finally {
      setLoading(false)
    }
  }, [selectedUsers])

  // Event style getter for different users
  const eventStyleGetter = (event: GroupEvent) => {
    const userIndex = selectedUsers.findIndex(u => u.id === event.resource.user.id)
    const colors = [
      { bg: "#3b82f6", border: "#2563eb" }, // Blue
      { bg: "#10b981", border: "#059669" }, // Green
      { bg: "#f59e0b", border: "#d97706" }, // Yellow
      { bg: "#8b5cf6", border: "#7c3aed" }, // Purple
      { bg: "#ef4444", border: "#dc2626" }, // Red
      { bg: "#06b6d4", border: "#0891b2" }, // Cyan
      { bg: "#84cc16", border: "#65a30d" }, // Lime
      { bg: "#f97316", border: "#ea580c" }, // Orange
    ]

    const color = colors[userIndex % colors.length]

    return {
      style: {
        backgroundColor: color.bg,
        borderColor: color.border,
        color: "#ffffff",
        border: "none",
        borderRadius: "4px",
        fontSize: "11px",
        padding: "2px 4px",
        cursor: "pointer"
      },
    }
  }

  // Toggle user selection
  const toggleUser = useCallback((user: User) => {
    console.log(`Toggling user:`, user)
    
    // Validate user data
    if (!user.id || !user.displayName) {
      console.error(`Invalid user data:`, user)
      return
    }
    
    // Check if user ID looks valid (should be a GUID)
    if (user.id === user.displayName || user.id.length < 10) {
      console.error(`Suspicious user ID - displayName and ID are the same or ID is too short:`, user)
      return
    }
    
    const isSelected = selectedUsers.some(u => u.id === user.id)
    if (isSelected) {
      onUserSelect(selectedUsers.filter(u => u.id !== user.id))
    } else {
      onUserSelect([...selectedUsers, user])
    }
  }, [selectedUsers, onUserSelect])

  // Load data on mount
  useEffect(() => {
    // Check if user is signed in first
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/debug/session', {
          credentials: 'include'
        })
        if (response.ok) {
          fetchUsers()
        } else {
          console.log('User not authenticated, please sign in first')
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
      }
    }
    
    checkAuth()
  }, [fetchUsers])

  // Fetch events when selected users change
  useEffect(() => {
    fetchGroupEvents()
  }, [fetchGroupEvents])

  const messages = {
    allDay: "All Day",
    previous: "Previous",
    next: "Next",
    today: "Today",
    month: "Month",
    week: "Week",
    day: "Day",
    agenda: "Agenda",
    date: "Date",
    time: "Time",
    event: "Event",
    noEventsInRange: "No events in this range.",
    showMore: (total: number) => `+${total} more`,
  }

  return (
    <div className="space-y-6">
      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaUsers className="w-5 h-5" />
            SELECT COLLEAGUES FOR AVAILABILITY VIEW
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Users */}
            {selectedUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">SELECTED USERS ({selectedUsers.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user, index) => {
                    const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-red-500", "bg-cyan-500", "bg-lime-500", "bg-orange-500"]
                    const color = colors[index % colors.length]
                    return (
                      <Badge 
                        key={user.id} 
                        variant="secondary" 
                        className={`${color} text-white cursor-pointer hover:opacity-80`}
                        onClick={() => toggleUser(user)}
                      >
                        <FaUser className="w-3 h-3 mr-1" />
                        {user.displayName}
                      </Badge>
                    )
                  })}
                </div>
                
                {/* Debug info for selected users */}
                <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                  <strong>Debug - Selected Users:</strong>
                  {selectedUsers.map((user, index) => (
                    <div key={user.id} className="ml-2">
                      {index + 1}. {user.displayName} (ID: {user.id})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">AVAILABLE USERS</h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers}
                  className="text-xs"
                >
                  Refresh Users
                </Button>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                {users.length > 0 ? `Loaded ${users.length} users from your organization` : 'No users loaded - click "Refresh Users" to load colleagues'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                {users
                  .filter(user => !selectedUsers.some(u => u.id === user.id))
                  .map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleUser(user)}
                    >
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <FaUser className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">
                          {user.displayName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {user.jobTitle || user.department}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Add
                      </Button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      {errorMessages.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-orange-800">CALENDAR ACCESS ISSUES</h4>
              {errorMessages.map((error, index) => (
                <div key={index} className="text-sm text-orange-700">{error}</div>
              ))}
              <div className="text-xs text-orange-600 mt-2">
                💡 <strong>Tip:</strong> Ask colleagues to share their calendars with you, or check if you have the right permissions.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Group Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FaCalendarAlt className="w-5 h-5" />
              GROUP AVAILABILITY CALENDAR
            </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={view} onValueChange={(value) => setView(value as View)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={Views.MONTH}>Month</SelectItem>
                    <SelectItem value={Views.WEEK}>Week</SelectItem>
                    <SelectItem value={Views.DAY}>Day</SelectItem>
                    <SelectItem value={Views.AGENDA}>Agenda</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate(new Date())}
                >
                  Today
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[600px] w-full">
              {selectedUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-4">
                    <FaUsers className="w-16 h-16 text-gray-300 mx-auto" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">NO USERS SELECTED</h3>
                      <p className="text-gray-500 mb-4">Select colleagues from the list above to view their availability</p>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>💡 <strong>How to use:</strong></p>
                        <p>1. Browse available users below</p>
                        <p>2. Click &quot;Add&quot; next to colleagues you want to see</p>
                        <p>3. Their calendars will appear here with different colors</p>
                        <p>4. Find common free time slots for meetings</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading availability for {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}...</p>
                  </div>
                </div>
              ) : (
                <Calendar
                  localizer={localizer}
                  events={events}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: "100%" }}
                  defaultDate={date}
                  date={date}
                  onNavigate={setDate}
                  view={view}
                  onView={setView}
                  popup={true}
                  messages={messages}
                  eventPropGetter={eventStyleGetter}
                  className="rbc-calendar"
                  step={15}
                  timeslots={4}
                  showMultiDayTimes={true}
                  doShowMoreDrillDown={true}
                />
              )}
            </div>
          </CardContent>
        </Card>

      {/* Legend */}
      {selectedUsers.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">LEGEND</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {selectedUsers.map((user, index) => {
                const colors = [
                  "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", 
                  "bg-red-500", "bg-cyan-500", "bg-lime-500", "bg-orange-500"
                ]
                const color = colors[index % colors.length]
                return (
                  <div key={user.id} className="flex items-center gap-2">
                    <div className={`w-4 h-4 ${color} rounded`}></div>
                    <span className="text-sm">{user.displayName}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
