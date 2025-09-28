import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schema for user sync
const syncUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  name: z.string().nullable().optional(),
  email: z.string().email('Valid email is required'),
  jobTitle: z.string().nullable().optional(),
  role: z.string().default('USER'),
})

// POST /api/users/sync - Sync user from tenant to local database
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'write', resource: 'user' })

    const body = await request.json()
    const validatedData = syncUserSchema.parse(body)

    console.log('Syncing user to local database:', {
      id: validatedData.id,
      name: validatedData.name,
      email: validatedData.email
    })

    // Check if user already exists in local database by tenantId or email
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { tenantId: validatedData.id },
          { email: validatedData.email }
        ]
      }
    })

    if (existingUser) {
      // Update existing user with tenant data
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name: validatedData.name || validatedData.email, // Fallback to email if name is null
          email: validatedData.email,
          jobTitle: validatedData.jobTitle,
          role: validatedData.role as 'USER' | 'ADMIN' | 'MANAGER',
          tenantId: validatedData.id,
          isFromTenantSync: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          role: true,
          tenantId: true,
        }
      })

      console.log('Updated existing user:', updatedUser)
      return NextResponse.json({ 
        user: updatedUser,
        action: 'updated'
      })
    } else {
      // Create new user in local database
      // Use a generated ID for the primary key, but store tenant ID separately
      const newUser = await prisma.user.create({
        data: {
          name: validatedData.name || validatedData.email, // Fallback to email if name is null
          email: validatedData.email,
          jobTitle: validatedData.jobTitle,
          role: validatedData.role as 'USER' | 'ADMIN' | 'MANAGER',
          tenantId: validatedData.id,
          isFromTenantSync: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          role: true,
          tenantId: true,
        }
      })

      console.log('Created new user:', newUser)
      return NextResponse.json({ 
        user: newUser,
        action: 'created'
      })
    }
  } catch (error) {
    console.error('Error syncing user:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to sync user' },
      { status: 500 }
    )
  }
}
