"use client"

import { useState, useMemo } from "react"
import { Calendar, momentLocalizer, Views, View } from "react-big-calendar"
import moment from "moment"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FaCalendarAlt, FaList, FaTable, FaClock } from "react-icons/fa"
import "react-big-calendar/lib/css/react-big-calendar.css"

// Extend the Event type from react-big-calendar
interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource?: {
    location?: string
    attendees?: Array<{
      name: string
      email: string
    }>
    showAs?: string
    sensitivity?: string
  }
}

interface ReactBigCalendarProps {
  events: CalendarEvent[]
  onSelectEvent?: (event: CalendarEvent) => void
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void
  loading?: boolean
}

const localizer = momentLocalizer(moment)

export function ReactBigCalendar({ events, onSelectEvent, onSelectSlot, loading = false }: ReactBigCalendarProps) {
  const [view, setView] = useState<View>(Views.MONTH)
  const [date, setDate] = useState(new Date())

  const { defaultDate, scrollToTime } = useMemo(() => ({
    defaultDate: new Date(),
    scrollToTime: new Date(1970, 1, 1, 6),
  }), [])

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
        borderRadius: "6px",
        fontSize: "12px",
        padding: "2px 4px",
      },
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

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FaCalendarAlt className="w-5 h-5" />
            CALENDAR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-2 text-gray-600">
              <FaClock className="w-4 h-4 animate-spin" />
              Loading calendar events...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FaCalendarAlt className="w-5 h-5" />
            OFFICE 365 CALENDAR
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
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-96 w-full">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            defaultDate={defaultDate}
            date={date}
            onNavigate={setDate}
            view={view}
            onView={setView}
            onSelectEvent={onSelectEvent}
            onSelectSlot={onSelectSlot}
            selectable={true}
            popup={true}
            messages={messages}
            eventPropGetter={eventStyleGetter}
            className="rbc-calendar"
          />
        </div>
        {events.length > 0 && (
          <div className="p-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{events.length} events loaded</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-500"></div>
                  <span>Busy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>Tentative</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}




