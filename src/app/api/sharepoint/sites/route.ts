import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Fetching SharePoint sites for:", session.user.email)

    try {
      // Fetch real SharePoint sites from Microsoft Graph
      const sites = await graphAPI.getSharePointSites()
      
      // Format sites for our UI
      const formattedSites = sites.map(site => ({
        id: site.id,
        displayName: site.displayName,
        webUrl: site.webUrl,
        description: site.description || `SharePoint site: ${site.displayName}`,
        emailAddress: site.webUrl // Use webUrl as emailAddress for consistency
      }))

      console.log(`Found ${formattedSites.length} SharePoint sites`)

      return NextResponse.json({
        sites: formattedSites,
        total: formattedSites.length,
        message: "SharePoint sites fetched successfully"
      })
    } catch (error) {
      console.error("Error fetching real SharePoint sites, falling back to sample data:", error)
      
      // Fallback to sample data if Microsoft Graph fails
      const sites = [
        {
          id: "site-1",
          displayName: "IT Department Site",
          webUrl: "https://company.sharepoint.com/sites/it",
          description: "IT Department SharePoint site",
          emailAddress: "https://company.sharepoint.com/sites/it"
        },
        {
          id: "site-2",
          displayName: "HR Department Site",
          webUrl: "https://company.sharepoint.com/sites/hr",
          description: "HR Department SharePoint site",
          emailAddress: "https://company.sharepoint.com/sites/hr"
        },
        {
          id: "site-3",
          displayName: "Finance Department Site",
          webUrl: "https://company.sharepoint.com/sites/finance",
          description: "Finance Department SharePoint site",
          emailAddress: "https://company.sharepoint.com/sites/finance"
        },
        {
          id: "site-4",
          displayName: "Marketing Department Site",
          webUrl: "https://company.sharepoint.com/sites/marketing",
          description: "Marketing Department SharePoint site",
          emailAddress: "https://company.sharepoint.com/sites/marketing"
        },
        {
          id: "site-5",
          displayName: "Sales Department Site",
          webUrl: "https://company.sharepoint.com/sites/sales",
          description: "Sales Department SharePoint site",
          emailAddress: "https://company.sharepoint.com/sites/sales"
        },
        {
          id: "site-6",
          displayName: "Company Intranet",
          webUrl: "https://company.sharepoint.com/sites/intranet",
          description: "Main company intranet site",
          emailAddress: "https://company.sharepoint.com/sites/intranet"
        }
      ]

      return NextResponse.json({
        sites: sites,
        total: sites.length,
        message: "Using sample data - Microsoft Graph unavailable"
      })
    }

  } catch (error) {
    console.error("Error fetching SharePoint sites:", error)
    return NextResponse.json(
      { error: "Failed to fetch SharePoint sites", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
