"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { Trash2, Forward, FolderPlus, Reply } from "lucide-react"
import { format } from "date-fns"
import { deleteEmailAction, forwardEmailAction, replyEmailAction } from "./actions"
import { Email } from "./types"
import { usePathname } from "next/navigation"

interface EmailListProps {
  emails: Email[]
  hasMore: boolean
  nextLink: string | null
  currentFolder: string
  currentFolderId?: string
}

export function EmailList({ emails, hasMore, nextLink, currentFolder, currentFolderId }: EmailListProps) {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const pathname = usePathname()

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

  const handleForwardEmail = async (email: Email) => {
    try {
      // TODO: Get forward recipients from user input
      const result = await forwardEmailAction(email.messageId, [], '', pathname)
      if (result.success) {
        console.log("Email forwarded successfully")
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Failed to forward email:', error)
    }
  }

  const handleReplyEmail = async (email: Email) => {
    try {
      // TODO: Get reply comment from user input
      const result = await replyEmailAction(email.messageId, '', pathname)
      if (result.success) {
        console.log("Email replied successfully")
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.error('Failed to reply to email:', error)
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
                    <div className="flex items-center justify-between">
                      <div className="text-[12px] font-medium text-[#111827] truncate max-w-[260px]">{email.sender}</div>
                      <div className="text-[11px] text-[#6b7280]">{formatDate(email.receivedAt)}</div>
                    </div>
                    <div className="text-[13px] text-[#111827] truncate">{email.subject}</div>
                    <div className="text-[12px] text-[#6b7280] line-clamp-2 break-words">
                      {truncateText(stripHtml(email.htmlBody || email.body || ''))}
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => handleDeleteEmail(email)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleForwardEmail(email)}>
                    <Forward className="h-4 w-4 mr-2" />
                    Forward
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleSaveToFolder(email)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Save to folder
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => handleAssociateEmail(email)}>
                    <Reply className="h-4 w-4 mr-2" />
                    Associate
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
    </>
  )
}
