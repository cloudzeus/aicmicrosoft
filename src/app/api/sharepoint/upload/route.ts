import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const siteId = formData.get('siteId') as string
    const parentFolderId = formData.get('parentFolderId') as string
    const file = formData.get('file') as File

    if (!siteId || !parentFolderId || !file) {
      return NextResponse.json({ error: 'Missing siteId, parentFolderId or file' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()

    const uploaded = await graphAPI.uploadFileToSharePointFolder(
      siteId,
      parentFolderId,
      file.name,
      buffer,
    )

    // Email notify uploader + site members (include full path)
    const link = uploaded.webUrl
    const parentPath = uploaded.parentReference?.path || '' // e.g. /drive/root:/Folder/Sub
    const rootMarker = '/drive/root:'
    const pathFromRoot = parentPath.startsWith(rootMarker)
      ? parentPath.substring(rootMarker.length)
      : parentPath
    const fullPath = `${pathFromRoot || '/'}${pathFromRoot?.endsWith('/') ? '' : pathFromRoot ? '/' : ''}${uploaded.name}`
    const memberEmails = await graphAPI.getSharePointSiteMemberEmails(siteId)
    const recipients = Array.from(new Set([...(memberEmails || []), session.user.email!].filter(Boolean)))
    if (recipients.length > 0) {
      await graphAPI.sendMail(
        `New file uploaded: ${uploaded.name}`,
        `<p>A new file was uploaded to SharePoint.</p>
         <p><strong>Name:</strong> ${uploaded.name}</p>
         <p><strong>Path:</strong> ${fullPath}</p>
         <p><a href="${link}">Open in SharePoint</a></p>`,
        recipients
      )
    }

    return NextResponse.json({ success: true, item: uploaded })
  } catch (error) {
    console.error('Error uploading file to SharePoint:', error)
    return NextResponse.json({ error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
