"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Trash2, Forward, FolderPlus, Reply, ReplyAll, Mail, Paperclip, Clock } from "lucide-react"
import { format } from "date-fns"
import { deleteEmailAction, forwardEmailAction, replyEmailAction, composeEmailAction } from "./actions"
import { Email } from "./types"
import { usePathname } from "next/navigation"
import { EmailModal } from "@/components/emails/email-modal"
import { EmailComposeModal } from "@/components/emails/email-compose-modal"

interface EmailListProps {
  emails: Email[]
  hasMore: boolean
  nextLink: string | null
  currentFolder: string
  currentFolderId?: string
  onComposeEmail?: () => void
}

interface User {
  id: string
  name: string | null
  email: string
}

export function EmailList({ emails, hasMore, nextLink, currentFolder, currentFolderId, onComposeEmail }: EmailListProps) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [composeMode, setComposeMode] = useState<'reply' | 'replyAll' | 'forward' | 'compose'>('reply')
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

  const handleDeleteEmail = async (email: Email) => {
    try {
      const result = await deleteEmailAction(email.messageId, pathname)
      if (result.success) {
        console.log("Email deleted successfully")
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Failed to delete email:', error)
    }
  }

  const handleForwardEmail = (email: Email) => {
    setSelectedEmail(email)
    setComposeMode('forward')
    setShowComposeModal(true)
  }

  const handleReplyEmail = (email: Email) => {
    setSelectedEmail(email)
    setComposeMode('reply')
    setShowComposeModal(true)
  }

  const handleReplyAllEmail = (email: Email) => {
    setSelectedEmail(email)
    setComposeMode('replyAll')
    setShowComposeModal(true)
  }

  const handleComposeEmail = () => {
    if (onComposeEmail) {
      onComposeEmail()
    } else {
      setSelectedEmail(null)
      setComposeMode('compose')
      setShowComposeModal(true)
    }
  }

  const handleSendEmail = async (data: { recipients: string[], subject: string, body: string }) => {
    try {
      let result
      if (composeMode === 'reply') {
        if (!selectedEmail) return
        result = await replyEmailAction(selectedEmail.messageId, data.body, pathname)
      } else if (composeMode === 'replyAll') {
        if (!selectedEmail) return
        result = await replyEmailAction(selectedEmail.messageId, data.body, pathname)
      } else if (composeMode === 'forward') {
        if (!selectedEmail) return
        result = await forwardEmailAction(selectedEmail.messageId, data.recipients, data.body, pathname)
      } else {
        // Compose new email
        result = await composeEmailAction(data.recipients, data.subject, data.body, pathname)
      }
      
      if (result.success) {
        console.log(`Email ${composeMode === 'compose' ? 'sent' : composeMode + 'ed'} successfully`)
        setShowComposeModal(false)
        setSelectedEmail(null)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error(`Failed to ${composeMode === 'compose' ? 'send' : composeMode} email:`, error)
      alert(`Failed to ${composeMode === 'compose' ? 'send' : composeMode} email`)
    }
  }

  const handleSaveToFolder = (email: Email) => {
    // TODO: Implement save to folder functionality
    console.log('Saving email to folder:', email.id)
  }

  const handleAssociateEmail = (email: Email) => {
    // TODO: Implement associate functionality
    console.log('Associating email:', email.id)
  }

  const handleViewEmail = (email: Email) => {
    setSelectedEmail(email)
    setShowEmailModal(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else if (diffInHours < 168) { // 7 days
      return format(date, 'EEE')
    } else {
      return format(date, 'MMM dd')
    }
  }

  const stripHtml = (html: string) => {
    if (!html) return ''
    return html
      .replace(/<!--([\s\S]*?)-->/g, ' ')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  const truncateText = (text: string, maxLength: number = 160) => {
    const t = text || ''
    if (t.length <= maxLength) return t
    return t.substring(0, maxLength) + '…'
  }

  return (
    <>
      <Card className="border border-[#e5e7eb] shadow-sm overflow-auto">
        <CardContent className="p-0">
          <div>
            {emails.map((email) => (
              <ContextMenu key={`${email.id}-${email.receivedAt}`}>
                <ContextMenuTrigger asChild>
                  <div
                    onClick={() => handleViewEmail(email)}
                    className={`px-3 py-2 cursor-pointer border-b border-[#f0f0f0] hover:bg-[#f9fafb] ${!email.isRead ? 'bg-[#eef2ff] font-semibold' : 'bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-gray-900 truncate max-w-[240px]">{email.sender}</span>
                        {email.isImportant && (
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {email.hasAttachments && (
                          <Paperclip className="h-3 w-3 text-blue-600" />
                        )}
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">{formatDate(email.receivedAt)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-900 truncate font-medium mb-1">{email.subject}</div>
                    <div className="text-xs text-gray-500 line-clamp-2 break-words">
                      {truncateText(stripHtml(email.htmlBody || email.body || ''))}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleReplyEmail(email)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Reply
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleReplyAllEmail(email)}>
                    <ReplyAll className="h-4 w-4 mr-2" />
                    Reply to All
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleForwardEmail(email)}>
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleSaveToFolder(email)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Save to folder
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleDeleteEmail(email)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
            {hasMore && nextLink && (
              <div className="p-3 text-center">
                <Button size="sm" variant="outline" asChild>
                  <a href={`/emails?folder=${currentFolder}&folderId=${currentFolderId}&nextLink=${encodeURIComponent(nextLink)}`}>
                    Load more
                  </a>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Email Modal */}
      <EmailModal
        email={selectedEmail}
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false)
          setSelectedEmail(null)
        }}
        onReply={handleReplyEmail}
        onReplyAll={handleReplyAllEmail}
        onForward={handleForwardEmail}
        onDelete={handleDeleteEmail}
        onSaveToFolder={handleSaveToFolder}
      />

      {/* Compose Modal */}
      <EmailComposeModal
        isOpen={showComposeModal}
        onClose={() => {
          setShowComposeModal(false)
          setSelectedEmail(null)
        }}
        onSend={handleSendEmail}
        originalEmail={selectedEmail}
        mode={composeMode}
        users={users}
      />
    </>
  )
}
