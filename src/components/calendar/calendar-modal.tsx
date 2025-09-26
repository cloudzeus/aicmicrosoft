"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUser, FaSpinner, FaExclamationTriangle, FaList, FaTable } from "react-icons/fa"
import { ReactBigCalendar } from "./react-big-calendar"
import "./calendar-styles.css"

interface CalendarEvent {
  id: string
  subject: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: Array<{
    emailAddress: {
      name: string
      address: string
    }
    type: string
  }>
  isAllDay: boolean
  showAs: string
  sensitivity: string
}

interface CalendarModalProps {
  children: React.ReactNode
}

export function CalendarModal({ children }: CalendarModalProps) {
  const { data: session } = useSession()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')

  const fetchCalendarEvents = async () => {
    if (!session) return

    setLoading(true)
    setError(null)

    try {
      // Get access token from session
      const response = await fetch('/api/calendar/events', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.statusText}`)
      }

      const data = await response.json()
      setEvents(data.events || [])
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar events')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen && events.length === 0) {
      fetchCalendarEvents()
    }
  }

  const formatDateTime = (dateTime: string, timeZone: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      timeZone: timeZone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getEventStatusColor = (showAs: string) => {
    switch (showAs.toLowerCase()) {
      case 'free':
        return 'bg-green-100 text-green-800'
      case 'tentative':
        return 'bg-yellow-100 text-yellow-800'
      case 'busy':
        return 'bg-red-100 text-red-800'
      case 'oof':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Transform events for React Big Calendar
  const transformEventsForCalendar = (events: CalendarEvent[]) => {
    return events.map(event => ({
      id: event.id,
      title: event.subject,
      start: new Date(event.start.dateTime),
      end: new Date(event.end.dateTime),
      resource: {
        location: event.location?.displayName,
        attendees: event.attendees?.map(attendee => ({
          name: attendee.emailAddress.name,
          email: attendee.emailAddress.address
        })),
        showAs: event.showAs,
        sensitivity: event.sensitivity
      }
    }))
  }

  const handleEventSelect = (event: { id: string; title: string; start: Date; end: Date }) => {
    console.log('Event selected:', event)
  }

  const handleSlotSelect = (slotInfo: { start: Date; end: Date }) => {
    console.log('Slot selected:', slotInfo)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FaCalendarAlt className="w-5 h-5" />
                OFFICE 365 CALENDAR
              </DialogTitle>
              <DialogDescription>
                VIEW YOUR MICROSOFT 365 CALENDAR EVENTS AND SCHEDULE
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={view === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('calendar')}
                className="flex items-center gap-2"
              >
                <FaCalendarAlt className="w-3 h-3" />
                Calendar
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('list')}
                className="flex items-center gap-2"
              >
                <FaList className="w-3 h-3" />
                List
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <FaSpinner className="w-6 h-6 animate-spin mr-2" />
              <span>LOADING CALENDAR EVENTS...</span>
            </div>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <FaExclamationTriangle className="w-4 h-4" />
                  <span className="font-medium">ERROR LOADING CALENDAR</span>
                </div>
                <p className="text-red-600 mt-2">{error}</p>
                <Button
                  onClick={fetchCalendarEvents}
                  variant="outline"
                  size="sm"
                  className="mt-4"
                >
                  TRY AGAIN
                </Button>
              </CardContent>
            </Card>
          )}

          {!loading && !error && events.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <FaCalendarAlt className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">NO EVENTS FOUND</h3>
                <p className="text-gray-600">
                  NO CALENDAR EVENTS FOUND FOR THE CURRENT PERIOD.
                </p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">
                  {view === 'calendar' ? 'CALENDAR VIEW' : 'EVENTS LIST'} ({events.length})
                </h3>
                <Button
                  onClick={fetchCalendarEvents}
                  variant="outline"
                  size="sm"
                >
                  REFRESH
                </Button>
              </div>

              {view === 'calendar' ? (
                <ReactBigCalendar
                  events={transformEventsForCalendar(events)}
                  onSelectEvent={handleEventSelect}
                  onSelectSlot={handleSlotSelect}
                  loading={loading}
                />
              ) : (
                <div className="space-y-3">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.subject}</CardTitle>
                            <CardDescription className="mt-1">
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <FaClock className="w-3 h-3" />
                                  {formatDateTime(event.start.dateTime, event.start.timeZone)}
                                </div>
                                {event.location?.displayName && (
                                  <div className="flex items-center gap-1">
                                    <FaMapMarkerAlt className="w-3 h-3" />
                                    {event.location.displayName}
                                  </div>
                                )}
                              </div>
                            </CardDescription>
                          </div>
                          <Badge className={getEventStatusColor(event.showAs)}>
                            {event.showAs.toUpperCase()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {event.attendees && event.attendees.length > 0 && (
                          <>
                            <Separator className="mb-3" />
                            <div className="space-y-2">
                              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                <FaUser className="w-3 h-3" />
                                ATTENDEES ({event.attendees.length})
                              </div>
                              <div className="grid gap-1">
                                {event.attendees.slice(0, 3).map((attendee, index) => (
                                  <div key={index} className="text-sm text-gray-600">
                                    {attendee.emailAddress.name || attendee.emailAddress.address}
                                    {attendee.type !== 'required' && (
                                      <Badge variant="outline" className="ml-2 text-xs">
                                        {attendee.type}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                                {event.attendees.length > 3 && (
                                  <div className="text-sm text-gray-500">
                                    +{event.attendees.length - 3} MORE ATTENDEES
                                  </div>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
