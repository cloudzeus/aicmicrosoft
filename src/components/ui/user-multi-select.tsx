"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FaUser, FaUsers } from "react-icons/fa"

interface User {
  id: string
  displayName: string
  mail: string
  userPrincipalName: string
  jobTitle?: string
  department?: string
}

interface UserMultiSelectProps {
  selected: string[]
  onChange: (emails: string[]) => void
  placeholder?: string
  className?: string
}

export function UserMultiSelect({ selected, onChange, placeholder = "Select attendees", className = "" }: UserMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [query, setQuery] = useState("")

  useEffect(() => {
    let ignore = false
    const load = async () => {
      try {
        const res = await fetch('/api/users', { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        if (!ignore) setUsers(data.users || [])
      } catch (e) {
        console.error('Failed to load users', e)
      }
    }
    load()
    return () => { ignore = true }
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      u.displayName?.toLowerCase().includes(q) ||
      u.mail?.toLowerCase().includes(q) ||
      u.userPrincipalName?.toLowerCase().includes(q)
    )
  }, [users, query])

  const toggle = (user: User) => {
    const email = user.mail || user.userPrincipalName
    if (!email) return
    if (selected.includes(email)) {
      onChange(selected.filter(e => e !== email))
    } else {
      onChange([...selected, email])
    }
  }

  return (
    <div className={className}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selected.map((email) => (
            <Badge key={email} variant="secondary" className="flex items-center gap-1">
              <FaUser className="w-3 h-3" />
              {email}
            </Badge>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
            <span className="truncate flex items-center gap-2">
              <FaUsers className="w-4 h-4" />
              {selected.length > 0 ? `${selected.length} selected` : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
          <Command>
            <CommandInput placeholder="Search users..." value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandGroup>
                {filtered.map((user) => {
                  const email = user.mail || user.userPrincipalName
                  const checked = email ? selected.includes(email) : false
                  return (
                    <CommandItem key={user.id} onSelect={() => email && toggle(user)} className="flex items-center gap-3">
                      <Checkbox checked={checked} onCheckedChange={() => email && toggle(user)} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{user.displayName}</div>
                        <div className="text-xs text-gray-500 truncate">{email}</div>
                      </div>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}


