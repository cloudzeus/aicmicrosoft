"use client"

import { useState, useEffect, useCallback } from "react"
import { Calendar, momentLocalizer, Views, View, SlotInfo } from "react-big-calendar"
import moment from "moment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { FaCalendarAlt, FaList, FaTable, FaClock, FaPlus, FaEdit, FaTrash, FaUsers, FaVideo, FaBell } from "react-icons/fa"
import { SmartAttendeesInput } from "@/components/ui/smart-attendees-input"
import "react-big-calendar/lib/css/react-big-calendar.css"
import "./calendar-styles.css"

const localizer = momentLocalizer(moment)

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  resource?: {
    location?: string
    attendees?: Array<{
      name: string
      email: string
    }>
    showAs?: string
    sensitivity?: string
    isOnlineMeeting?: boolean
    onlineMeetingProvider?: string
    description?: string
    organizer?: {
      name: string
      email: string
    }
  }
}

interface EventFormData {
  title: string
  start: Date
  end: Date
  allDay: boolean
  location: string
  description: string
  showAs: string
  isOnlineMeeting: boolean
  attendees: string
}

export function FullCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)
  const [isEditingEvent, setIsEditingEvent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [showUserSearch, setShowUserSearch] = useState(false)
  const [users, setUsers] = useState<Array<{ id: string; displayName: string; mail: string }>>([])
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    allDay: false,
    location: "",
    description: "",
    showAs: "busy",
    isOnlineMeeting: false,
    attendees: ""
  })

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/calendar/events')
      if (response.ok) {
        const data = await response.json()
        const transformedEvents = data.events.map((event: {
          id: string;
          subject: string;
          start: { dateTime: string };
          end: { dateTime: string };
          isAllDay: boolean;
          location?: { displayName?: string };
          sensitivity?: string;
          attendees?: Array<{ emailAddress: { name: string; address: string } }>;
          showAs?: string;
          isOnlineMeeting?: boolean;
          onlineMeetingProvider?: string;
          bodyPreview?: string;
          organizer?: { emailAddress: { name: string; address: string } };
        }) => ({
          id: event.id,
          title: event.subject,
          start: new Date(event.start.dateTime),
          end: new Date(event.end.dateTime),
          allDay: event.isAllDay,
          resource: {
            location: event.location?.displayName,
            attendees: event.attendees?.map((attendee: { emailAddress: { name: string; address: string } }) => ({
              name: attendee.emailAddress.name,
              email: attendee.emailAddress.address
            })),
            showAs: event.showAs,
            sensitivity: event.sensitivity,
            isOnlineMeeting: event.isOnlineMeeting,
            onlineMeetingProvider: event.onlineMeetingProvider,
            description: event.bodyPreview,
            organizer: {
              name: event.organizer?.emailAddress?.name || "",
              email: event.organizer?.emailAddress?.address || ""
            }
          }
        }))
        setEvents(transformedEvents)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

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

  useEffect(() => {
    if (showUserSearch && users.length === 0) {
      fetchUsers()
    }
  }, [showUserSearch, users.length, fetchUsers])

  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = "#3b82f6" // Default blue
    let borderColor = "#2563eb"
    let color = "#ffffff"

    if (event.resource?.showAs === "free") {
      backgroundColor = "#10b981" // Green
      borderColor = "#059669"
    } else if (event.resource?.showAs === "tentative") {
      backgroundColor = "#f59e0b" // Yellow
      borderColor = "#d97706"
      color = "#ffffff"
    } else if (event.resource?.showAs === "oof") {
      backgroundColor = "#8b5cf6" // Purple
      borderColor = "#7c3aed"
    } else if (event.resource?.sensitivity === "private") {
      backgroundColor = "#ef4444" // Red
      borderColor = "#dc2626"
    }

    return {
      style: {
        backgroundColor,
        borderColor,
        color,
        border: "none",
        borderRadius: "4px",
        fontSize: "12px",
        padding: "2px 4px",
        cursor: "pointer"
      },
    }
  }

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setFormData({
      title: "",
      start: slotInfo.start,
      end: slotInfo.end,
      allDay: false,
      location: "",
      description: "",
      showAs: "busy",
      isOnlineMeeting: false,
      attendees: ""
    })
    setIsCreatingEvent(true)
    setIsEditingEvent(false)
  }

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay || false,
      location: event.resource?.location || "",
      description: event.resource?.description || "",
      showAs: event.resource?.showAs || "busy",
      isOnlineMeeting: event.resource?.isOnlineMeeting || false,
      attendees: ""
    })
    setIsEditingEvent(true)
    setIsCreatingEvent(false)
  }

  const handleCreateEvent = async () => {
    try {
      // Create event via Microsoft Graph API
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchEvents()
        setIsCreatingEvent(false)
        setFormData({
          title: "",
          start: new Date(),
          end: new Date(Date.now() + 60 * 60 * 1000),
          allDay: false,
          location: "",
          description: "",
          showAs: "busy",
          isOnlineMeeting: false,
          attendees: ""
        })
      }
    } catch (error) {
      console.error('Error creating event:', error)
    }
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchEvents()
        setIsEditingEvent(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Error updating event:', error)
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch(`/api/calendar/events/${selectedEvent.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchEvents()
        setIsEditingEvent(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

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
      {/* Header Controls */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FaCalendarAlt className="w-5 h-5" />
              CALENDAR
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={view} onValueChange={(value) => setView(value as View)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Views.MONTH}>
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="w-3 h-3" />
                      Month
                    </div>
                  </SelectItem>
                  <SelectItem value={Views.WEEK}>
                    <div className="flex items-center gap-2">
                      <FaTable className="w-3 h-3" />
                      Week
                    </div>
                  </SelectItem>
                  <SelectItem value={Views.DAY}>
                    <div className="flex items-center gap-2">
                      <FaClock className="w-3 h-3" />
                      Day
                    </div>
                  </SelectItem>
                  <SelectItem value={Views.AGENDA}>
                    <div className="flex items-center gap-2">
                      <FaList className="w-3 h-3" />
                      Agenda
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDate(new Date())}
              >
                Today
              </Button>
              <Button
                onClick={() => {
                  setFormData({
                    title: "",
                    start: new Date(),
                    end: new Date(Date.now() + 60 * 60 * 1000),
                    allDay: false,
                    location: "",
                    description: "",
                    showAs: "busy",
                    isOnlineMeeting: false,
                    attendees: ""
                  })
                  setIsCreatingEvent(true)
                  setIsEditingEvent(false)
                }}
                className="flex items-center gap-2"
              >
                <FaPlus className="w-4 h-4" />
                New Event
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
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
              onSelectEvent={handleSelectEvent}
              onSelectSlot={handleSelectSlot}
              selectable={true}
              popup={true}
              messages={messages}
              eventPropGetter={eventStyleGetter}
              className="rbc-calendar"
              step={15}
              timeslots={4}
              showMultiDayTimes={true}
              doShowMoreDrillDown={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={isEditingEvent} onOpenChange={setIsEditingEvent}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaEdit className="w-5 h-5" />
              EVENT DETAILS
            </DialogTitle>
            <DialogDescription>
              View and edit your calendar event
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-6">
              <div className="grid gap-4">
                <div>
                  <Label className="text-sm font-medium">TITLE</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Event title"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">START</Label>
                    <Input
                      type="datetime-local"
                      value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => setFormData({...formData, start: new Date(e.target.value)})}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium">END</Label>
                    <Input
                      type="datetime-local"
                      value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                      onChange={(e) => setFormData({...formData, end: new Date(e.target.value)})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">LOCATION</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="Meeting location"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">DESCRIPTION</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Event description"
                    rows={3}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">ATTENDEES</Label>
                  <SmartAttendeesInput
                    value={formData.attendees}
                    onChange={(value) => setFormData({...formData, attendees: value})}
                    placeholder="Type email addresses or @ to search users..."
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allDay"
                      checked={formData.allDay}
                      onCheckedChange={(checked) => setFormData({...formData, allDay: !!checked})}
                    />
                    <Label htmlFor="allDay">All Day Event</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onlineMeeting"
                      checked={formData.isOnlineMeeting}
                      onCheckedChange={(checked) => setFormData({...formData, isOnlineMeeting: !!checked})}
                    />
                    <Label htmlFor="onlineMeeting">Online Meeting</Label>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">SHOW AS</Label>
                  <Select value={formData.showAs} onValueChange={(value) => setFormData({...formData, showAs: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="tentative">Tentative</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="oof">Out of Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Event Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">EVENT INFORMATION</h4>
                <div className="space-y-2 text-sm">
                  {selectedEvent.resource?.organizer && (
                    <div className="flex items-center gap-2">
                      <FaUsers className="w-3 h-3" />
                      <span>Organizer: {selectedEvent.resource.organizer.name}</span>
                    </div>
                  )}
                  {selectedEvent.resource?.attendees && selectedEvent.resource.attendees.length > 0 && (
                    <div className="flex items-center gap-2">
                      <FaUsers className="w-3 h-3" />
                      <span>{selectedEvent.resource.attendees.length} attendees</span>
                    </div>
                  )}
                  {selectedEvent.resource?.isOnlineMeeting && (
                    <div className="flex items-center gap-2">
                      <FaVideo className="w-3 h-3" />
                      <span>Teams Meeting</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <FaBell className="w-3 h-3" />
                    <span>15 minutes before</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={handleDeleteEvent}
                  className="flex items-center gap-2"
                >
                  <FaTrash className="w-4 h-4" />
                  Delete
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsEditingEvent(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateEvent}>
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={isCreatingEvent} onOpenChange={setIsCreatingEvent}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FaPlus className="w-5 h-5" />
              CREATE NEW EVENT
            </DialogTitle>
            <DialogDescription>
              Add a new event to your calendar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label className="text-sm font-medium">TITLE</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Event title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">START</Label>
                  <Input
                    type="datetime-local"
                    value={moment(formData.start).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setFormData({...formData, start: new Date(e.target.value)})}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">END</Label>
                  <Input
                    type="datetime-local"
                    value={moment(formData.end).format('YYYY-MM-DDTHH:mm')}
                    onChange={(e) => setFormData({...formData, end: new Date(e.target.value)})}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">LOCATION</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Meeting location"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">DESCRIPTION</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Event description"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-sm font-medium">ATTENDEES</Label>
                <SmartAttendeesInput
                  value={formData.attendees}
                  onChange={(value) => setFormData({...formData, attendees: value})}
                  placeholder="Type email addresses or @ to search users..."
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="allDayNew"
                    checked={formData.allDay}
                    onCheckedChange={(checked) => setFormData({...formData, allDay: !!checked})}
                  />
                  <Label htmlFor="allDayNew">All Day Event</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="onlineMeetingNew"
                    checked={formData.isOnlineMeeting}
                    onCheckedChange={(checked) => setFormData({...formData, isOnlineMeeting: !!checked})}
                  />
                  <Label htmlFor="onlineMeetingNew">Online Meeting</Label>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">SHOW AS</Label>
                <Select value={formData.showAs} onValueChange={(value) => setFormData({...formData, showAs: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="tentative">Tentative</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="oof">Out of Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreatingEvent(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent}>
                Create Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


