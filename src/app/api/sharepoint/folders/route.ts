import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { siteId, parentFolderId, name } = await request.json()

    if (!siteId || !parentFolderId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: siteId, parentFolderId, name" },
        { status: 400 }
      )
    }

    const created = await graphAPI.createSharePointFolder(siteId, parentFolderId, name)

    // Email notify uploader + site members (include full path)
    const parentPath = created.parentReference?.path || ''
    const rootMarker = '/drive/root:'
    const pathFromRoot = parentPath.startsWith(rootMarker)
      ? parentPath.substring(rootMarker.length)
      : parentPath
    const fullPath = `${pathFromRoot || '/'}${pathFromRoot?.endsWith('/') ? '' : pathFromRoot ? '/' : ''}${created.name}`
    const memberEmails = await graphAPI.getSharePointSiteMemberEmails(siteId)
    const recipients = Array.from(new Set([...(memberEmails || []), session.user.email!].filter(Boolean)))
    if (recipients.length > 0) {
      await graphAPI.sendMail(
        `New folder created: ${created.name}`,
        `<p>A new folder was created in SharePoint.</p>
         <p><strong>Name:</strong> ${created.name}</p>
         <p><strong>Path:</strong> ${fullPath}</p>
         <p><a href="${created.webUrl}">Open in SharePoint</a></p>`,
        recipients
      )
    }

    return NextResponse.json({
      success: true,
      item: created
    })
  } catch (error) {
    console.error("Error creating SharePoint folder:", error)
    return NextResponse.json(
      { error: "Failed to create SharePoint folder", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
