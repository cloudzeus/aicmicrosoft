import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Fetching SharePoint sites for:", session.user.email)

    const sites = await graphAPI.getSharePointSites()

    console.log(`Found ${sites.length} SharePoint sites`)

    return NextResponse.json({
      sites: sites,
      total: sites.length,
      message: "SharePoint sites fetched successfully"
    })

  } catch (error) {
    console.error("Error fetching SharePoint sites:", error)
    return NextResponse.json(
      { error: "Failed to fetch SharePoint sites", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
