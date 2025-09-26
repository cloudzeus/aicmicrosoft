"use client"

import { useState } from "react"
import { GroupCalendar } from "./group-calendar"

export function GroupCalendarWrapper() {
  const [selectedUsers, setSelectedUsers] = useState<Array<{ id: string; displayName: string; mail: string; userPrincipalName?: string }>>([])

  return (
    <GroupCalendar 
      selectedUsers={selectedUsers} 
      onUserSelect={setSelectedUsers}
    />
  )
}
