import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

export const runtime = 'nodejs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const folders = await graphAPI.getAllMailFolders()
    return NextResponse.json({ folders })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 })
  }
}
