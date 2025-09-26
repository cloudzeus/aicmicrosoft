import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { graphAPI } from "@/lib/microsoft-graph"

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')!
    const itemId = searchParams.get('itemId')!
    if (!siteId || !itemId) {
      return NextResponse.json({ error: 'Missing siteId or itemId' }, { status: 400 })
    }
    await graphAPI.deleteSharePointItem(siteId, itemId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting SharePoint item:', error)
    return NextResponse.json({ error: 'Failed to delete item', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')!
    const itemId = searchParams.get('itemId')!
    if (!siteId || !itemId) {
      return NextResponse.json({ error: 'Missing siteId or itemId' }, { status: 400 })
    }
    const res = await graphAPI.downloadSharePointItem(siteId, itemId)
    if (!res.ok) {
      const t = await res.text()
      return NextResponse.json({ error: 'Failed to download', details: t }, { status: res.status })
    }
    const arrayBuf = await res.arrayBuffer()
    const contentType = res.headers.get('content-type') || 'application/octet-stream'
    return new NextResponse(arrayBuf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment'
      }
    })
  } catch (error) {
    console.error('Error downloading SharePoint item:', error)
    return NextResponse.json({ error: 'Failed to download item', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { siteId, itemId, name } = body as { siteId: string; itemId: string; name: string }
    if (!siteId || !itemId || !name) {
      return NextResponse.json({ error: 'Missing siteId, itemId or name' }, { status: 400 })
    }
    const renamed = await graphAPI.renameSharePointItem(siteId, itemId, name)
    return NextResponse.json({ success: true, item: renamed })
  } catch (error) {
    console.error('Error renaming SharePoint item:', error)
    return NextResponse.json({ error: 'Failed to rename item', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
