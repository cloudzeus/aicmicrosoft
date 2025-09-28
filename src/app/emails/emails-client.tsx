"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { EmailList } from "./email-list"
import { EmailComposeModal } from "@/components/emails/email-compose-modal"
import { composeEmailAction } from "./actions"
import { Email } from "./types"

interface User {
  id: string
  name: string | null
  email: string
}


interface Folder {
  id: string
  displayName: string
  unreadItemCount: number
}

interface EmailsClientProps {
  emails: Email[]
  hasMore: boolean
  nextLink: string | null
  folders: Folder[]
  currentFolder: string
  currentFolderId?: string
}

export function EmailsClient({ 
  emails, 
  hasMore, 
  nextLink, 
  folders, 
  currentFolder, 
  currentFolderId 
}: EmailsClientProps) {
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const pathname = usePathname()

  // Fetch users for multiselect
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const data = await response.json()
          setUsers(data.users || [])
        }
      } catch (error) {
        console.error('Failed to fetch users:', error)
      }
    }
    fetchUsers()
  }, [])

  const handleComposeEmail = () => {
    setShowComposeModal(true)
  }

  const handleSendEmail = async (data: { recipients: string[], subject: string, body: string }) => {
    try {
      const result = await composeEmailAction(data.recipients, data.subject, data.body, pathname)
      
      if (result.success) {
        console.log('Email sent successfully')
        setShowComposeModal(false)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      alert('Failed to send email')
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-gray-900">Email Management</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="text-xs h-7">
              <Link href={`/emails?folder=${currentFolder}&folderId=${currentFolderId}`}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Link>
            </Button>
            <Button 
              onClick={handleComposeEmail}
              size="sm" 
              className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Compose
            </Button>
          </div>
        </div>
      </div>

      {/* Outlook-like 3-pane layout */}
      <div className="grid grid-cols-[240px_1fr] gap-3 h-[calc(100vh-200px)]">
        {/* Folders */}
        <Card className="border border-[#e5e7eb] shadow-sm overflow-auto">
          <CardHeader className="py-3">
            <CardTitle className="text-xs font-medium text-gray-900">Folders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex flex-col">
              {folders.sort((a,b) => (a.displayName.toLowerCase()==='inbox'? -1 : b.displayName.toLowerCase()==='inbox'? 1 : a.displayName.localeCompare(b.displayName)))
                .map((f) => (
                <Button
                  key={f.id}
                  asChild
                  variant={currentFolder === f.displayName.toLowerCase() ? "secondary" : "ghost"}
                  className="justify-between px-3 py-2 h-auto text-xs hover:bg-gray-50"
                >
                  <Link href={`/emails?folder=${f.displayName.toLowerCase()}&folderId=${f.id}`}>
                    <span className="font-medium">{f.displayName}</span>
                    {f.unreadItemCount > 0 && (
                      <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                        {f.unreadItemCount}
                      </span>
                    )}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Message list */}
        <EmailList 
          emails={emails}
          hasMore={hasMore}
          nextLink={nextLink}
          currentFolder={currentFolder}
          currentFolderId={currentFolderId}
          onComposeEmail={handleComposeEmail}
        />
      </div>

      {/* Compose Modal */}
      <EmailComposeModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSend={handleSendEmail}
        originalEmail={null}
        mode="compose"
        users={users}
      />
    </>
  )
}
