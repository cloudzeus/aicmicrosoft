"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-green-600" />
              <DialogTitle className="text-sm font-semibold text-gray-900">
                {email.subject}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
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
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Email Header */}
          <Card className="border border-[#e5e7eb] shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-500" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-900">{email.sender}</div>
                    <div className="text-xs text-gray-500">{email.recipient}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">{formatDate(email.receivedAt)}</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Email Content */}
          <Card className="border border-[#e5e7eb] shadow-sm">
            <CardContent className="pt-3 pb-4">
              {email.htmlBody ? (
                <div 
                  className="prose prose-sm max-w-none text-xs text-gray-900 leading-relaxed
                    [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded [&_img]:shadow-sm [&_img]:my-2 [&_img]:block
                    [&_p]:text-xs [&_p]:mb-2 [&_p]:leading-relaxed
                    [&_div]:text-xs [&_div]:leading-relaxed
                    [&_span]:text-xs [&_span]:leading-relaxed
                    [&_a]:text-blue-600 [&_a]:underline [&_a]:text-xs
                    [&_h1]:text-xs [&_h1]:font-semibold [&_h1]:mb-2 [&_h1]:mt-3
                    [&_h2]:text-xs [&_h2]:font-semibold [&_h2]:mb-2 [&_h2]:mt-3
                    [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3
                    [&_h4]:text-xs [&_h4]:font-semibold [&_h4]:mb-2 [&_h4]:mt-3
                    [&_h5]:text-xs [&_h5]:font-semibold [&_h5]:mb-2 [&_h5]:mt-3
                    [&_h6]:text-xs [&_h6]:font-semibold [&_h6]:mb-2 [&_h6]:mt-3
                    [&_ul]:text-xs [&_ul]:mb-2 [&_ul]:pl-4
                    [&_ol]:text-xs [&_ol]:mb-2 [&_ol]:pl-4
                    [&_li]:text-xs [&_li]:mb-1 [&_li]:leading-relaxed
                    [&_table]:text-xs [&_table]:border-collapse [&_table]:w-full [&_table]:mb-3
                    [&_td]:text-xs [&_td]:border [&_td]:border-gray-200 [&_td]:p-1 [&_td]:align-top
                    [&_th]:text-xs [&_th]:border [&_th]:border-gray-200 [&_th]:p-1 [&_th]:bg-gray-50 [&_th]:font-semibold [&_th]:text-left
                    [&_blockquote]:text-xs [&_blockquote]:border-l-2 [&_blockquote]:border-gray-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:my-2
                    [&_code]:text-xs [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded
                    [&_pre]:text-xs [&_pre]:bg-gray-100 [&_pre]:p-2 [&_pre]:rounded [&_pre]:overflow-x-auto [&_pre]:my-2"
                  dangerouslySetInnerHTML={{ __html: email.htmlBody }}
                />
              ) : email.body ? (
                <div className="text-xs text-gray-900 whitespace-pre-wrap leading-relaxed">
                  {email.body}
                </div>
              ) : (
                <div className="text-xs text-gray-500 italic">
                  No content available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {email.hasAttachments && (
            <Card className="border border-[#e5e7eb] shadow-sm">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-gray-900">Attachments</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This email contains attachments
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply(email)}
              className="text-xs h-7"
            >
              <Reply className="h-3 w-3 mr-1" />
              Reply
            </Button>
            {onReplyAll && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReplyAll(email)}
                className="text-xs h-7"
              >
                <ReplyAll className="h-3 w-3 mr-1" />
                Reply All
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onForward(email)}
              className="text-xs h-7"
            >
              <Forward className="h-3 w-3 mr-1" />
              Forward
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSaveToFolder(email)}
              className="text-xs h-7"
            >
              <FolderPlus className="h-3 w-3 mr-1" />
              Save to Folder
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(email)}
            className="text-xs h-7"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
