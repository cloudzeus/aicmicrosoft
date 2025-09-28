import { auth } from './auth'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function getAccessToken(request?: NextRequest) {
  try {
    // Try to get token from request if available
    if (request) {
      const token = await getToken({ 
        req: request,
        secret: process.env.AUTH_SECRET 
      })
      return token?.accessToken as string
    }
    
    // Fallback: get from session
    const session = await auth()
    return session?.accessToken as string
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}
