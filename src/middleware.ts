import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Temporarily disabled middleware due to Edge Runtime compatibility issues
  // Authentication will be handled at the page level instead
  return NextResponse.next()
}

export const config = {
  matcher: [] // Disabled matcher - no routes will trigger middleware
}
