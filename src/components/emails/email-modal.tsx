"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, User, Clock, Paperclip, Reply, ReplyAll, Forward, Trash2, FolderPlus } from "lucide-react"
import { format } from "date-fns"
import { Email } from "@/app/emails/types"

interface EmailModalProps {
  email: Email | null
  isOpen: boolean
  onClose: () => void
  onReply: (email: Email) => void
  onReplyAll?: (email: Email) => void
  onForward: (email: Email) => void
  onDelete: (email: Email) => void
  onSaveToFolder: (email: Email) => void
}

export function EmailModal({
  email,
  isOpen,
  onClose,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onSaveToFolder
}: EmailModalProps) {
  if (!email) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'PPP p')
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[1400px] w-full rounded-lg bg-white p-8 dark:bg-gray-950 max-h-[80vh] overflow-auto mx-4 sm:mx-6 md:mx-8 lg:mx-10">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Mail className="h-6 w-6 text-green-600" />
            {email.subject}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            From: {email.sender} • To: {email.recipient} • Date: {formatDate(email.receivedAt)}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            {email.isImportant && (
              <Badge variant="destructive" className="text-xs">
                High Priority
              </Badge>
            )}
            {!email.isRead && (
              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                Unread
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid gap-6 py-6">
          {/* Email Header Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-100 rounded-lg p-4 dark:bg-gray-800">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Sender Information
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{email.sender}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4 dark:bg-gray-800">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Received Date
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{formatDate(email.receivedAt)}</p>
            </div>
          </div>

          {/* Email Content */}
          <div className="bg-gray-100 rounded-lg p-6 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4">Email Content</h3>
            {email.htmlBody ? (
              <div 
                className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed space-y-3"
                style={{
                  lineHeight: '1.6',
                  fontSize: '14px'
                }}
                dangerouslySetInnerHTML={{ __html: email.htmlBody }}
              />
            ) : email.body ? (
              <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {email.body}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                No content available
              </div>
            )}
          </div>

          {/* Attachments */}
          {email.hasAttachments && (
            <div className="bg-gray-100 rounded-lg p-4 dark:bg-gray-800">
              <h3 className="text-lg font-medium flex items-center gap-2 mb-2">
                <Paperclip className="h-4 w-4 text-blue-600" />
                Attachments
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                This email contains attachments
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => onReply(email)}
              className="flex items-center gap-2"
            >
              <Reply className="h-4 w-4" />
              Reply
            </Button>
            {onReplyAll && (
              <Button
                variant="outline"
                onClick={() => onReplyAll(email)}
                className="flex items-center gap-2"
              >
                <ReplyAll className="h-4 w-4" />
                Reply All
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onForward(email)}
              className="flex items-center gap-2"
            >
              <Forward className="h-4 w-4" />
              Forward
            </Button>
            <Button
              variant="outline"
              onClick={() => onSaveToFolder(email)}
              className="flex items-center gap-2"
            >
              <FolderPlus className="h-4 w-4" />
              Save to Folder
            </Button>
          </div>
          <Button
            variant="destructive"
            onClick={() => onDelete(email)}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
