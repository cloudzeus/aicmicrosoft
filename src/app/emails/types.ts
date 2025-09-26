export interface Email {
  id: string
  messageId: string
  subject: string
  sender: string
  recipient: string
  body: string | null | undefined
  htmlBody: string | null | undefined
  receivedAt: string
  isRead: boolean
  isImportant: boolean
  hasAttachments: boolean
  attachments: Array<{ name: string; contentType: string; size: number }> | null
}

export interface Folder {
  id: string
  displayName: string
  unreadItemCount: number
}
