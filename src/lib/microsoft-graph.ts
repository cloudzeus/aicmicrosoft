import { auth } from "@/lib/auth"
import { prisma } from "./prisma"

export interface GraphEvent {
  id: string
  subject: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  location?: {
    displayName: string
  }
  attendees?: Array<{
    emailAddress: {
      name: string
      address: string
    }
    type: string
  }>
  isAllDay: boolean
  showAs: string
  sensitivity: string
}

export interface GraphEmail {
  id: string
  subject: string
  from: {
    emailAddress: {
      name: string
      address: string
    }
  }
  toRecipients: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  ccRecipients?: Array<{
    emailAddress: {
      name: string
      address: string
    }
  }>
  body: {
    content: string
    contentType: string
  }
  receivedDateTime: string
  isRead: boolean
  importance: string
  hasAttachments: boolean
  attachments?: Array<{
    id: string
    name: string
    contentType: string
    size: number
  }>
}

export interface GraphMailFolder {
  id: string
  displayName: string
  childFolderCount: number
  totalItemCount: number
  unreadItemCount: number
}

export interface SharePointSite {
  id: string
  displayName: string
  webUrl: string
  description?: string
  siteCollection?: {
    hostname: string
  }
  createdDateTime: string
  lastModifiedDateTime: string
}

export interface SharePointDriveItem {
  id: string
  name: string
  webUrl: string
  size: number
  lastModifiedDateTime: string
  createdDateTime: string
  folder?: {
    childCount: number
  }
  file?: {
    mimeType: string
    hashes?: {
      sha1Hash?: string
      quickXorHash?: string
    }
  }
  parentReference?: {
    driveId: string
    driveType: string
    id: string
    name: string
    path: string
  }
}

export class MicrosoftGraphAPI {
  private baseUrl = 'https://graph.microsoft.com/v1.0'
  
  // Helper method to refresh access token
  private async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
    const url = `https://login.microsoftonline.com/${process.env.TENANT_ID}/oauth2/v2.0/token`
    
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
        client_secret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      method: "POST",
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText} - ${error}`)
    }

    const refreshedTokens = await response.json()
    return {
      accessToken: refreshedTokens.access_token,
      expiresIn: refreshedTokens.expires_in
    }
  }

  // Helper method to get access token from session user
  private async getAccessTokenFromSession(): Promise<string> {
    const session = await auth()
    if (!session?.user) {
      throw new Error('No authenticated session found')
    }

    // Get user from database to access their Microsoft account
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true }
    })
    
    if (!user) throw new Error('User not found in database')
    
    return await this.getValidAccessToken(user.id)
  }

  // Helper method to get valid access token with automatic refresh
  private async getValidAccessToken(userId: string): Promise<string> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    })
    
    if (!user) throw new Error('User not found')
    
    const microsoftAccount = user.accounts.find(a => a.provider === "c03bef53-43af-4d5e-be22-da859317086c")
    if (!microsoftAccount?.access_token) throw new Error('No Microsoft access token')
    
    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = microsoftAccount.expires_at ? Math.floor(microsoftAccount.expires_at / 1000) : 0
    
    if (expiresAt - now < 300) { // 5 minutes buffer
      if (!microsoftAccount.refresh_token) {
        throw new Error('No refresh token available')
      }
      
      try {
        const refreshedTokens = await this.refreshAccessToken(microsoftAccount.refresh_token)
        
        // Update the database with new tokens
        await prisma.account.update({
          where: { id: microsoftAccount.id },
          data: {
            access_token: refreshedTokens.accessToken,
            expires_at: Date.now() + refreshedTokens.expiresIn * 1000
          }
        })
        
        return refreshedTokens.accessToken
      } catch (error) {
        console.error('Failed to refresh token:', error)
        throw new Error('Failed to refresh access token')
      }
    }
    
    return microsoftAccount.access_token
  }
  
  async getFreeBusy(
    schedules: string[],
    start: string,
    end: string,
    availabilityViewInterval: number = 30
  ): Promise<{
    scheduleId: string
    availabilityView?: string
    scheduleItems?: Array<{
      start: { dateTime: string; timeZone: string }
      end: { dateTime: string; timeZone: string }
      status?: string
      isPrivate?: boolean
      subject?: string
      location?: {
        displayName?: string
      }
    }>
  }[]> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }

    const url = `${this.baseUrl}/me/calendar/getSchedule`
    const body = {
      schedules,
      startTime: { dateTime: start, timeZone: 'UTC' },
      endTime: { dateTime: end, timeZone: 'UTC' },
      availabilityViewInterval
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Graph getSchedule error response:', errorText)
      throw new Error(`Graph getSchedule error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data.value || []
  }

  async getSharePointSites(): Promise<SharePointSite[]> {
    try {
      const session = await auth()
      
      if (!session?.user || !session.accessToken) {
        throw new Error('No authenticated session or access token found')
      }

      console.log('Fetching SharePoint sites with access token:', session.accessToken.substring(0, 20) + '...')

      const response = await fetch(`${this.baseUrl}/sites?search=*`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Graph API error response for SharePoint sites:', errorText)
        throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Graph API response for SharePoint sites:', data)
      return data.value || []
    } catch (error) {
      console.error('Error fetching SharePoint sites from Graph API:', error)
      throw error
    }
  }

  async getSharePointDriveItems(siteId: string, folderId?: string): Promise<SharePointDriveItem[]> {
    try {
      const session = await auth()
      
      if (!session?.user || !session.accessToken) {
        throw new Error('No authenticated session or access token found')
      }

      const path = folderId 
        ? `${this.baseUrl}/sites/${siteId}/drive/items/${folderId}/children`
        : `${this.baseUrl}/sites/${siteId}/drive/root/children`

      console.log('Fetching SharePoint drive items:', path)

      const response = await fetch(path, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Graph API error response for SharePoint drive items:', errorText)
        throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Graph API response for SharePoint drive items:', data)
      return data.value || []
    } catch (error) {
      console.error('Error fetching SharePoint drive items from Graph API:', error)
      throw error
    }
  }

  async getSharePointSiteMemberEmails(siteId: string): Promise<string[]> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }

    // Try site users endpoint; fall back to group drive owner if needed later
    const url = `${this.baseUrl}/sites/${siteId}/users?$select=mail,userPrincipalName`
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Graph API error fetching site users:', errorText)
      return []
    }
    const data = await response.json()
    const emails: string[] = (data.value || [])
      .map((u: { mail?: string; userPrincipalName?: string }) => u.mail || u.userPrincipalName)
      .filter((e: string | undefined) => !!e)
    return Array.from(new Set(emails))
  }

  async sendMail(subject: string, htmlBody: string, to: string[]): Promise<void> {
    const accessToken = await this.getAccessTokenFromSession()

    const payload = {
      message: {
        subject,
        body: { contentType: 'HTML', content: htmlBody },
        toRecipients: to.map(email => ({ emailAddress: { address: email } })),
      },
      saveToSentItems: false,
    }

    const res = await fetch(`${this.baseUrl}/me/sendMail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('Graph sendMail failed:', t)
      throw new Error(`Failed to send email: ${t}`)
    }
  }

  async getMyGroups(): Promise<Array<{ id: string; displayName: string; mail?: string; mailEnabled?: boolean; groupTypes?: string[] }>> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }

    const res = await fetch(`${this.baseUrl}/me/memberOf?$select=id,displayName,mail,mailEnabled,groupTypes`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('Graph getMyGroups error:', t)
      return []
    }
    const data = await res.json()
    return (data.value || []).filter((e: { '@odata.type'?: string }) => e['@odata.type']?.includes('group'))
  }

  async getSharedMailboxesIAmMember(): Promise<Array<{ id: string; displayName: string; mail?: string }>> {
    const groups = await this.getMyGroups()
    // Shared mailboxes are typically Exchange resources; a practical heuristic is mail-enabled security groups/Unified groups with a mailbox
    return groups
      .filter(g => g.mailEnabled && g.mail)
      .map(g => ({ id: g.id, displayName: g.displayName, mail: g.mail }))
  }

  async getMyProfilePhotoBase64(): Promise<string | null> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return null
    }
    const res = await fetch(`${this.baseUrl}/me/photo/$value`, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    })
    if (!res.ok) {
      return null
    }
    const buf = await res.arrayBuffer()
    const base64 = Buffer.from(buf).toString('base64')
    // Most org photos are jpeg
    return `data:image/jpeg;base64,${base64}`
  }

  async deleteSharePointItem(siteId: string, itemId: string): Promise<void> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }
    const url = `${this.baseUrl}/sites/${siteId}/drive/items/${itemId}`
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('Graph delete item failed:', t)
      throw new Error(`Delete failed: ${res.status} ${res.statusText}`)
    }
  }

  async downloadSharePointItem(siteId: string, itemId: string): Promise<Response> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }
    const url = `${this.baseUrl}/sites/${siteId}/drive/items/${itemId}/content`
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${session.accessToken}` },
    })
    return res
  }

  async renameSharePointItem(siteId: string, itemId: string, newName: string): Promise<SharePointDriveItem> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }
    const url = `${this.baseUrl}/sites/${siteId}/drive/items/${itemId}`
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName })
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('Graph rename item failed:', t)
      throw new Error(`Rename failed: ${res.status} ${res.statusText}`)
    }
    return await res.json()
  }

  async createSharePointFolder(siteId: string, parentFolderId: string, name: string): Promise<SharePointDriveItem> {
    try {
      const session = await auth()
      
      if (!session?.user || !session.accessToken) {
        throw new Error('No authenticated session or access token found')
      }

      const path = parentFolderId === 'root'
        ? `${this.baseUrl}/sites/${siteId}/drive/root/children`
        : `${this.baseUrl}/sites/${siteId}/drive/items/${parentFolderId}/children`

      const response = await fetch(path, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Graph API error creating folder:', errorText)
        throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return data as SharePointDriveItem
    } catch (error) {
      console.error('Error creating SharePoint folder via Graph API:', error)
      throw error
    }
  }

  async uploadFileToSharePointFolder(
    siteId: string,
    parentFolderId: string,
    fileName: string,
    fileBuffer: ArrayBuffer
  ): Promise<SharePointDriveItem> {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      throw new Error('No authenticated session or access token found')
    }

    const url = parentFolderId === 'root'
      ? `${this.baseUrl}/sites/${siteId}/drive/root:/${encodeURIComponent(fileName)}:/content`
      : `${this.baseUrl}/sites/${siteId}/drive/items/${parentFolderId}:/${encodeURIComponent(fileName)}:/content`

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/octet-stream',
      },
      body: Buffer.from(fileBuffer as ArrayBuffer)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Graph API error uploading file:', errorText)
      throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    return data as SharePointDriveItem
  }

  async getCalendarEvents(): Promise<GraphEvent[]> {
    try {
      // Get the session to extract access token
      const session = await auth()
      
      if (!session?.user || !session.accessToken) {
        throw new Error('No authenticated session or access token found')
      }

      console.log('Making Graph API call with access token:', session.accessToken.substring(0, 20) + '...')

      // Make the actual Microsoft Graph API call
      const response = await fetch(`${this.baseUrl}/me/events`, {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Graph API error response:', errorText)
        throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Graph API response:', data)
      return data.value || []
    } catch (error) {
      console.error('Error fetching calendar events from Graph API:', error)
      throw error
    }
  }

  async getCalendarEventsWithFallback(): Promise<GraphEvent[]> {
    try {
      // Try to get real events first
      return await this.getCalendarEvents()
    } catch (error) {
      console.warn('Falling back to mock data:', error)
      // Return mock data as fallback
      return this.getMockEvents()
    }
  }

  async getEmails(limit: number = 200): Promise<GraphEmail[]> {
    try {
      const session = await auth()
      
      if (!session?.user) {
        throw new Error('No authenticated session found')
      }

      // Get the user's Microsoft account to get the access token
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: {
          accounts: true,
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const microsoftAccount = user.accounts.find(account => account.provider === "c03bef53-43af-4d5e-be22-da859317086c")
      
      if (!microsoftAccount?.access_token) {
        throw new Error('No Microsoft account or access token found')
      }

      console.log('Making Graph API call for emails with access token:', microsoftAccount.access_token.substring(0, 20) + '...')

      // Make the actual Microsoft Graph API call for emails
      const response = await fetch(`${this.baseUrl}/me/messages?$top=${limit}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,ccRecipients,body,receivedDateTime,isRead,importance,hasAttachments,attachments`, {
        headers: {
          'Authorization': `Bearer ${microsoftAccount.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Graph API error response for emails:', errorText)
        throw new Error(`Graph API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Graph API response for emails:', data)
      return data.value || []
    } catch (error) {
      console.error('Error fetching emails from Graph API:', error)
      throw error
    }
  }

  async getEmailsWithFallback(limit: number = 200): Promise<GraphEmail[]> {
    try {
      // Try to get real emails first
      return await this.getEmails(limit)
    } catch (error) {
      console.warn('Falling back to mock email data:', error)
      // Return mock data as fallback
      return this.getMockEmails()
    }
  }

  async markEmailAsRead(messageId: string): Promise<void> {
    try {
      const session = await auth()
      
      if (!session?.user) {
        throw new Error('No authenticated session found')
      }

      // Get the user's Microsoft account to get the access token
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: {
          accounts: true,
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const microsoftAccount = user.accounts.find(account => account.provider === "c03bef53-43af-4d5e-be22-da859317086c")
      
      if (!microsoftAccount?.access_token) {
        throw new Error('No Microsoft account or access token found')
      }

      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${microsoftAccount.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isRead: true
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to mark email as read: ${response.status} ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error marking email as read:', error)
      throw error
    }
  }

  async deleteEmail(messageId: string): Promise<void> {
    try {
      const session = await auth()
      
      if (!session?.user) {
        throw new Error('No authenticated session found')
      }

      // Get the user's Microsoft account to get the access token
      const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
        include: {
          accounts: true,
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // Get valid access token with automatic refresh
      const accessToken = await this.getValidAccessToken(user.id)

      const response = await fetch(`${this.baseUrl}/me/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to delete email: ${response.status} ${response.statusText} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error deleting email:', error)
      throw error
    }
  }

  async replyEmail(messageId: string, comment: string): Promise<void> {
    const session = await auth()
    if (!session?.user) {
      throw new Error('No authenticated session found')
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true }
    })
    if (!user) throw new Error('User not found')
    
    // Get valid access token with automatic refresh
    const accessToken = await this.getValidAccessToken(user.id)
    
    const res = await fetch(`${this.baseUrl}/me/messages/${messageId}/reply`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment })
    })
    
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Reply failed: ${res.status} ${res.statusText} - ${t}`)
    }
  }

  async forwardEmail(messageId: string, to: string[], comment: string): Promise<void> {
    const session = await auth()
    if (!session?.user) {
      throw new Error('No authenticated session found')
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { accounts: true }
    })
    if (!user) throw new Error('User not found')
    
    // Get valid access token with automatic refresh
    const accessToken = await this.getValidAccessToken(user.id)
    
    const res = await fetch(`${this.baseUrl}/me/messages/${messageId}/forward`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment,
        toRecipients: to.map(address => ({ emailAddress: { address } }))
      })
    })
    
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Forward failed: ${res.status} ${res.statusText} - ${t}`)
    }
  }

  async getMailFolders(): Promise<GraphMailFolder[]> {
    const accessToken = await this.getAccessTokenFromSession()
    const res = await fetch(`${this.baseUrl}/me/mailFolders?$select=id,displayName,childFolderCount,totalItemCount,unreadItemCount`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })
    if (!res.ok) {
      const t = await res.text()
      console.error('Graph getMailFolders failed:', t)
      return []
    }
    const data = await res.json()
    return data.value || []
  }

  async getAllMailFolders(): Promise<GraphMailFolder[]> {
    const accessToken = await this.getAccessTokenFromSession()

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    const collect: GraphMailFolder[] = []
    const fetchPage = async (url: string) => {
      const res = await fetch(url, { headers })
      if (!res.ok) throw new Error(`Folders failed: ${res.status} ${res.statusText}`)
      const data = await res.json()
      collect.push(...(data.value || []))
      const next = data['@odata.nextLink']
      if (next) await fetchPage(next)
    }

    await fetchPage(`${this.baseUrl}/me/mailFolders?$top=50&$select=id,displayName,childFolderCount,totalItemCount,unreadItemCount`)

    // Recursively fetch children for any with childFolderCount > 0
    for (const f of [...collect]) {
      if (f.childFolderCount > 0) {
        await fetchPage(`${this.baseUrl}/me/mailFolders/${f.id}/childFolders?$top=50&$select=id,displayName,childFolderCount,totalItemCount,unreadItemCount`)
      }
    }
    return collect
  }

  async getMessages(
    folder: string = 'inbox',
    top: number = 50,
    nextLink?: string,
    folderId?: string
  ): Promise<{ value: GraphEmail[]; nextLink?: string }> {
    const accessToken = await this.getAccessTokenFromSession()

    let url: string
    if (nextLink) {
      url = nextLink
    } else if (folderId) {
      url = `${this.baseUrl}/me/mailFolders/${folderId}/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,body,receivedDateTime,isRead,importance,hasAttachments`
    } else if (folder.toLowerCase() === 'all') {
      url = `${this.baseUrl}/me/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,body,receivedDateTime,isRead,importance,hasAttachments`
    } else {
      // well-known folders per Graph use names like inbox, archive, sentitems, deleteditems
      const wellKnown = folder.toLowerCase().replace(' ', '')
      url = `${this.baseUrl}/me/mailFolders/${wellKnown}/messages?$top=${top}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,body,receivedDateTime,isRead,importance,hasAttachments`
    }

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Get messages failed: ${res.status} ${res.statusText} - ${t}`)
    }
    const data = await res.json()
    return { value: data.value || [], nextLink: data['@odata.nextLink'] }
  }

  private getMockEvents(): GraphEvent[] {
    const now = new Date()
    return [
      {
        id: "mock-1",
        subject: "TEAM MEETING",
        start: {
          dateTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC"
        },
        end: {
          dateTime: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC"
        },
        location: {
          displayName: "CONFERENCE ROOM A"
        },
        attendees: [
          {
            emailAddress: {
              name: "John Doe",
              address: "john.doe@aic.gr"
            },
            type: "required"
          },
          {
            emailAddress: {
              name: "Jane Smith",
              address: "jane.smith@aic.gr"
            },
            type: "required"
          }
        ],
        isAllDay: false,
        showAs: "busy",
        sensitivity: "normal"
      },
      {
        id: "mock-2",
        subject: "PROJECT REVIEW",
        start: {
          dateTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC"
        },
        end: {
          dateTime: new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC"
        },
        location: {
          displayName: "VIRTUAL MEETING"
        },
        attendees: [
          {
            emailAddress: {
              name: "Mike Johnson",
              address: "mike.johnson@aic.gr"
            },
            type: "required"
          }
        ],
        isAllDay: false,
        showAs: "busy",
        sensitivity: "normal"
      },
      {
        id: "mock-3",
        subject: "LUNCH BREAK",
        start: {
          dateTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC"
        },
        end: {
          dateTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
          timeZone: "UTC"
        },
        isAllDay: false,
        showAs: "free",
        sensitivity: "normal"
      }
    ]
  }

  private getMockEmails(): GraphEmail[] {
    const now = new Date()
    return [
      {
        id: "mock-email-1",
        subject: "WEEKLY PROJECT UPDATE",
        from: {
          emailAddress: {
            name: "John Doe",
            address: "john.doe@aic.gr"
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: "Jane Smith",
              address: "jane.smith@aic.gr"
            }
          }
        ],
        body: {
          content: "Hi team, here's the weekly project update...",
          contentType: "text"
        },
        receivedDateTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: false,
        importance: "normal",
        hasAttachments: true,
        attachments: [
          {
            id: "att-1",
            name: "project-report.pdf",
            contentType: "application/pdf",
            size: 1024000
          }
        ]
      },
      {
        id: "mock-email-2",
        subject: "MEETING REMINDER",
        from: {
          emailAddress: {
            name: "Calendar System",
            address: "calendar@aic.gr"
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: "Mike Johnson",
              address: "mike.johnson@aic.gr"
            }
          }
        ],
        body: {
          content: "This is a reminder for your upcoming meeting...",
          contentType: "text"
        },
        receivedDateTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        isRead: true,
        importance: "high",
        hasAttachments: false
      },
      {
        id: "mock-email-3",
        subject: "NEW CLIENT INQUIRY",
        from: {
          emailAddress: {
            name: "Sarah Wilson",
            address: "sarah.wilson@client.com"
          }
        },
        toRecipients: [
          {
            emailAddress: {
              name: "Support Team",
              address: "support@aic.gr"
            }
          }
        ],
        body: {
          content: "Hello, I'm interested in your services...",
          contentType: "text"
        },
        receivedDateTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
        isRead: false,
        importance: "high",
        hasAttachments: false
      }
    ]
  }
}

export const graphAPI = new MicrosoftGraphAPI()
