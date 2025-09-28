"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FaSearch, FaRedo, FaCloud, FaDatabase } from "react-icons/fa"

interface TenantUser {
  id: string
  displayName: string
  mail: string
  userPrincipalName?: string
  jobTitle?: string
  department?: string
  officeLocation?: string
  isFromTenantSync?: boolean
}

interface TenantUsersClientProps {
  users: TenantUser[]
  onRefresh?: () => void
  refreshing?: boolean
}

export function TenantUsersClient({ users, onRefresh, refreshing = false }: TenantUsersClientProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase()
    return (
      user.displayName?.toLowerCase().includes(searchLower) ||
      user.mail?.toLowerCase().includes(searchLower) ||
      user.userPrincipalName?.toLowerCase().includes(searchLower) ||
      user.jobTitle?.toLowerCase().includes(searchLower) ||
      user.department?.toLowerCase().includes(searchLower)
    )
  })

  const getDomainFromEmail = (email: string) => {
    return email.split('@')[1] || ''
  }

  const getUniqueDomains = () => {
    const domains = new Set<string>()
    users.forEach(user => {
      if (user.mail) {
        domains.add(getDomainFromEmail(user.mail))
      }
    })
    return Array.from(domains).sort()
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const uniqueDomains = getUniqueDomains()

  return (
    <div className="space-y-6">
      {/* Search and Refresh Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7280] w-4 h-4" />
          <Input
            placeholder="Search users by name, email, title, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {onRefresh && (
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm"
            disabled={refreshing}
          >
            <FaRedo className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Domains Summary */}
      <div className="flex flex-wrap gap-2">
        {uniqueDomains.map((domain) => {
          const domainUsers = users.filter(user => getDomainFromEmail(user.mail || '') === domain)
          return (
            <div 
              key={domain} 
              className="bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] px-3 py-1 rounded-full text-sm"
            >
              {domain} ({domainUsers.length})
            </div>
          )
        })}
      </div>

      {/* Users List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-[#6b7280]">
              {searchTerm ? 'No users found matching your search.' : 'No users found.'}
            </div>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className="border border-[#e5e7eb] rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center text-sm font-semibold">
                  {getInitials(user.displayName || user.mail || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[14px] text-[#111827] truncate">
                    {user.displayName || 'NO NAME PROVIDED'}
                  </h3>
                  <div className="space-y-1 mt-2">
                    <div className="flex items-center gap-2 text-[12px] text-[#6b7280]">
                      <span className="truncate">{user.mail || 'No email'}</span>
                    </div>
                    {user.jobTitle && (
                      <div className="text-[12px] text-[#374151] truncate">
                        {user.jobTitle}
                      </div>
                    )}
                    {user.department && (
                      <div className="text-[11px] text-[#6b7280] truncate">
                        {user.department}
                      </div>
                    )}
                    {user.officeLocation && (
                      <div className="text-[11px] text-[#6b7280] truncate">
                        📍 {user.officeLocation}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-[10px] bg-[#f3f4f6] text-[#374151] border border-[#e5e7eb] px-2 py-1 rounded inline-block">
                      {getDomainFromEmail(user.mail || '')}
                    </div>
                    {user.isFromTenantSync !== undefined && (
                      <Badge 
                        variant={user.isFromTenantSync ? "default" : "secondary"}
                        className={`text-[10px] px-2 py-1 ${
                          user.isFromTenantSync 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {user.isFromTenantSync ? (
                          <>
                            <FaCloud className="w-2 h-2 mr-1" />
                            Office 365
                          </>
                        ) : (
                          <>
                            <FaDatabase className="w-2 h-2 mr-1" />
                            Local
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
