"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Mail, Users, X, Plus, Send, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Email } from "@/app/emails/types"

interface User {
  id: string
  name: string | null
  email: string
}

interface EmailComposeModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (data: { recipients: string[], subject: string, body: string }) => Promise<void>
  originalEmail?: Email | null
  mode: 'reply' | 'replyAll' | 'forward'
  users?: User[]
}

export function EmailComposeModal({
  isOpen,
  onClose,
  onSend,
  originalEmail,
  mode,
  users = []
}: EmailComposeModalProps) {
  const [recipients, setRecipients] = useState<string[]>([])
  const [newRecipient, setNewRecipient] = useState("")
  const [showUserSelect, setShowUserSelect] = useState(false)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Initialize form based on mode and original email
  useEffect(() => {
    if (originalEmail && isOpen) {
      if (mode === 'reply') {
        setRecipients([originalEmail.sender])
        setSubject(originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`)
        setBody(`\n\n--- Original Message ---\nFrom: ${originalEmail.sender}\nDate: ${new Date(originalEmail.receivedAt).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body || stripHtml(originalEmail.htmlBody || '')}`)
      } else if (mode === 'replyAll') {
        // For now, replyAll behaves the same as reply
        // You can extend this to include CC recipients from the original email
        setRecipients([originalEmail.sender])
        setSubject(originalEmail.subject.startsWith('Re:') ? originalEmail.subject : `Re: ${originalEmail.subject}`)
        setBody(`\n\n--- Original Message ---\nFrom: ${originalEmail.sender}\nDate: ${new Date(originalEmail.receivedAt).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body || stripHtml(originalEmail.htmlBody || '')}`)
      } else if (mode === 'forward') {
        setRecipients([])
        setSubject(originalEmail.subject.startsWith('Fwd:') ? originalEmail.subject : `Fwd: ${originalEmail.subject}`)
        setBody(`\n\n--- Forwarded Message ---\nFrom: ${originalEmail.sender}\nDate: ${new Date(originalEmail.receivedAt).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body || stripHtml(originalEmail.htmlBody || '')}`)
      }
    } else if (isOpen) {
      // Reset form when opening without original email
      setRecipients([])
      setSubject("")
      setBody("")
    }
  }, [originalEmail, mode, isOpen])

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

  const handleAddRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()])
      setNewRecipient("")
    }
  }

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r !== email))
  }

  const handleSelectUser = (user: User) => {
    if (!recipients.includes(user.email)) {
      setRecipients([...recipients, user.email])
    }
    setShowUserSelect(false)
  }

  const handleSend = async () => {
    if (recipients.length === 0 || !subject.trim()) {
      return
    }

    setIsLoading(true)
    try {
      await onSend({
        recipients,
        subject: subject.trim(),
        body: body.trim()
      })
      onClose()
    } catch (error) {
      console.error('Failed to send email:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(newRecipient.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(newRecipient.toLowerCase()))
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[80vw] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-green-600" />
            <DialogTitle className="text-sm font-semibold text-gray-900">
              {mode === 'reply' ? 'Reply to Email' : mode === 'replyAll' ? 'Reply to All' : mode === 'forward' ? 'Forward Email' : 'Compose Email'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Recipients */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-900">Recipients</label>
            <div className="flex flex-wrap gap-1 p-2 border border-gray-200 rounded-md min-h-[40px]">
              {recipients.map((email) => (
                <Badge key={email} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                  {email}
                  <button
                    onClick={() => handleRemoveRecipient(email)}
                    className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Popover open={showUserSelect} onOpenChange={setShowUserSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-6 px-2 text-gray-500 hover:text-gray-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add recipient
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search users or enter email..."
                      value={newRecipient}
                      onValueChange={setNewRecipient}
                      className="text-xs"
                    />
                    <CommandList>
                      <CommandEmpty className="text-xs text-gray-500 py-2">
                        No users found or press Enter to add custom email
                      </CommandEmpty>
                      {filteredUsers.length > 0 && (
                        <CommandGroup>
                          {filteredUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.name} ${user.email}`}
                              onSelect={() => handleSelectUser(user)}
                              className="text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-3 w-3 text-gray-500" />
                                <div>
                                  <div className="font-medium">{user.name}</div>
                                  <div className="text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            {newRecipient && (
              <div className="flex gap-2">
                <Input
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="Enter email address"
                  className="text-xs h-7"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <Button
                  onClick={handleAddRecipient}
                  size="sm"
                  className="text-xs h-7"
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-900">Subject</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject"
              className="text-xs h-7"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-900">Message</label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Type your message here..."
              className="text-xs min-h-[200px] resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-xs h-7"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={recipients.length === 0 || !subject.trim() || isLoading}
            className="text-xs h-7"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-3 w-3 mr-1" />
                Send
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
