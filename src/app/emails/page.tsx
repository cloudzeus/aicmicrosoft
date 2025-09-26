import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"
import { redirect } from "next/navigation"
import { EmailList } from "./email-list"

interface EmailsPageProps {
  searchParams: Promise<{
    folder?: string
    folderId?: string
    page?: string
    nextLink?: string
  }>
}

async function getEmailsData(folder: string = 'inbox', folderId?: string, nextLink?: string) {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin')
  }

  try {
    const { value: graphEmails, nextLink: serverNextLink } = await graphAPI.getMessages(
      folder.toUpperCase(), 
      50, 
      nextLink, 
      folderId
    )
    
    const emails = graphEmails.map((graphEmail: {
      id: string;
      subject?: string;
      from?: { emailAddress?: { address?: string } };
      toRecipients?: Array<{ emailAddress?: { address?: string } }>;
      body?: { contentType?: string; content?: string };
      receivedDateTime: string;
      isRead?: boolean;
      importance?: string;
      hasAttachments?: boolean;
    }) => ({
      id: graphEmail.id,
      messageId: graphEmail.id,
      subject: (graphEmail.subject || 'No Subject'),
      sender: (graphEmail.from?.emailAddress?.address || 'Unknown Sender'),
      recipient: (graphEmail.toRecipients?.[0]?.emailAddress?.address || session.user.email!),
      body: graphEmail.body?.contentType === 'text' ? graphEmail.body?.content : null,
      htmlBody: graphEmail.body?.contentType === 'html' ? graphEmail.body?.content : null,
      receivedAt: graphEmail.receivedDateTime,
      isRead: graphEmail.isRead || false,
      isImportant: graphEmail.importance === 'high',
      hasAttachments: graphEmail.hasAttachments || false,
      attachments: null,
    }))

    return {
      emails,
      nextLink: serverNextLink || null,
      hasMore: Boolean(serverNextLink)
    }
  } catch (error) {
    console.error('Error fetching emails:', error)
    return {
      emails: [],
      nextLink: null,
      hasMore: false
    }
  }
}

async function getFoldersData() {
  const session = await auth()
  if (!session?.user) {
    return []
  }

  try {
    const folders = await graphAPI.getAllMailFolders()
    return folders.map((f: { id: string; displayName: string; unreadItemCount: number }) => ({
      id: f.id,
      displayName: f.displayName,
      unreadItemCount: f.unreadItemCount
    }))
  } catch (error) {
    console.error('Error fetching folders:', error)
    return []
  }
}

export default async function EmailsPage({ searchParams }: EmailsPageProps) {
  const params = await searchParams
  const folder = params.folder || 'inbox'
  const folderId = params.folderId
  const nextLink = params.nextLink
  
  const [emailsData, folders] = await Promise.all([
    getEmailsData(folder, folderId, nextLink),
    getFoldersData()
  ])

  // Find the inbox folder for default selection
  const inboxFolder = folders.find(f => f.displayName.toLowerCase() === 'inbox')
  const currentFolderId = folderId || inboxFolder?.id

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="mx-auto p-4 max-w-[1400px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to dashboard
              </Link>
            </Button>
            <h1 className="text-[18px] font-semibold text-[#1f2328]">Mail</h1>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/emails?folder=${folder}&folderId=${currentFolderId}`}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Link>
            </Button>
          </div>
        </div>

        {/* Outlook-like 3-pane layout */}
        <div className="grid grid-cols-[240px_1fr] gap-3 h-[calc(100vh-120px)]">
          {/* Folders */}
          <Card className="border border-[#e5e7eb] shadow-sm overflow-auto">
            <CardHeader className="py-2">
              <CardTitle className="text-[12px] text-[#6b7280]">Folders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col text-[13px]">
                {folders.sort((a,b) => (a.displayName.toLowerCase()==='inbox'? -1 : b.displayName.toLowerCase()==='inbox'? 1 : a.displayName.localeCompare(b.displayName)))
                  .map((f) => (
                  <Button
                    key={f.id}
                    asChild
                    variant={folder === f.displayName.toLowerCase() ? "secondary" : "ghost"}
                    className="justify-between px-3 py-2 h-auto"
                  >
                    <Link href={`/emails?folder=${f.displayName.toLowerCase()}&folderId=${f.id}`}>
                      <span>{f.displayName}</span>
                      <span className="text-[12px] text-[#6b7280]">{f.unreadItemCount}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Message list */}
          <Suspense fallback={
            <Card className="border border-[#e5e7eb] shadow-sm overflow-auto">
              <CardContent className="p-0">
                <div className="p-3 space-y-2">
                  {[...Array(8)].map((_,i)=> <Skeleton key={i} className="h-10" />)}
                </div>
              </CardContent>
            </Card>
          }>
            <EmailList 
              emails={emailsData.emails}
              hasMore={emailsData.hasMore}
              nextLink={emailsData.nextLink}
              currentFolder={folder}
              currentFolderId={currentFolderId}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
