import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const folderId = searchParams.get('folderId')
    
    if (!siteId) {
      return NextResponse.json(
        { error: "Missing required 'siteId' parameter" },
        { status: 400 }
      )
    }

    console.log(`Fetching SharePoint files for site: ${siteId}, folder: ${folderId || 'root'}`)

    const files = await graphAPI.getSharePointDriveItems(siteId, folderId || undefined)

    console.log(`Found ${files.length} files/folders`)

    return NextResponse.json({
      files: files,
      total: files.length,
      siteId,
      folderId: folderId || 'root',
      message: "SharePoint files fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching SharePoint files:", error)
    return NextResponse.json(
      { error: "Failed to fetch SharePoint files", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
