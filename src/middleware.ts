import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await auth()
  
      // Protect dashboard and other authenticated routes
      if (request.nextUrl.pathname.startsWith("/dashboard") || 
          request.nextUrl.pathname.startsWith("/calendar")) {
        if (!session) {
          return NextResponse.redirect(new URL("/auth/signin", request.url))
        }
      }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/calendar/:path*"]
}
