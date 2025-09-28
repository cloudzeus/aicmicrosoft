import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAccess } from '@/lib/auth-helpers'
import { z } from 'zod'

// Validation schemas
const deleteRequestSchema = z.object({
  type: z.enum(['user', 'department', 'position', 'sharepoint']),
  ids: z.array(z.string()).min(1, 'At least one ID is required'),
})

// POST /api/management/delete-local - Delete local (non-tenant-synced) items
export async function POST(request: NextRequest) {
  try {
    await requireAccess({ action: 'delete', resource: 'user' })

    const body = await request.json()
    const validatedData = deleteRequestSchema.parse(body)

    const { type, ids } = validatedData
    const results = {
      deleted: [] as string[],
      skipped: [] as string[],
      errors: [] as { id: string; error: string }[],
    }

    switch (type) {
      case 'user':
        for (const id of ids) {
          try {
            const user = await prisma.user.findUnique({
              where: { id },
              select: { id: true, isFromTenantSync: true, email: true },
            })

            if (!user) {
              results.errors.push({ id, error: 'User not found' })
              continue
            }

            if (user.isFromTenantSync) {
              results.skipped.push(id)
              continue
            }

            await prisma.user.delete({ where: { id } })
            results.deleted.push(id)
          } catch (error) {
            results.errors.push({ 
              id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      case 'department':
        for (const id of ids) {
          try {
            const department = await prisma.department.findUnique({
              where: { id },
              select: { 
                id: true, 
                isFromTenantSync: true, 
                name: true,
                _count: {
                  select: {
                    userDepartments: true,
                    positions: true,
                    sharePoints: true,
                    children: true,
                  },
                },
              },
            })

            if (!department) {
              results.errors.push({ id, error: 'Department not found' })
              continue
            }

            if (department.isFromTenantSync) {
              results.skipped.push(id)
              continue
            }

            // Check for dependencies
            const hasDependencies = 
              department._count.userDepartments > 0 ||
              department._count.positions > 0 ||
              department._count.sharePoints > 0 ||
              department._count.children > 0

            if (hasDependencies) {
              results.errors.push({ 
                id, 
                error: 'Cannot delete department with assigned users, positions, SharePoint sites, or child departments' 
              })
              continue
            }

            await prisma.department.delete({ where: { id } })
            results.deleted.push(id)
          } catch (error) {
            results.errors.push({ 
              id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      case 'position':
        for (const id of ids) {
          try {
            const position = await prisma.position.findUnique({
              where: { id },
              select: { 
                id: true, 
                isFromTenantSync: true, 
                name: true,
                _count: {
                  select: {
                    userPositions: true,
                  },
                },
              },
            })

            if (!position) {
              results.errors.push({ id, error: 'Position not found' })
              continue
            }

            if (position.isFromTenantSync) {
              results.skipped.push(id)
              continue
            }

            // Check for dependencies
            if (position._count.userPositions > 0) {
              results.errors.push({ 
                id, 
                error: 'Cannot delete position with assigned users' 
              })
              continue
            }

            await prisma.position.delete({ where: { id } })
            results.deleted.push(id)
          } catch (error) {
            results.errors.push({ 
              id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      case 'sharepoint':
        for (const id of ids) {
          try {
            const sharePoint = await prisma.departmentSharePoint.findUnique({
              where: { id },
              select: { 
                id: true, 
                isFromTenantSync: true, 
                displayName: true,
              },
            })

            if (!sharePoint) {
              results.errors.push({ id, error: 'SharePoint site not found' })
              continue
            }

            if (sharePoint.isFromTenantSync) {
              results.skipped.push(id)
              continue
            }

            await prisma.departmentSharePoint.delete({ where: { id } })
            results.deleted.push(id)
          } catch (error) {
            results.errors.push({ 
              id, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            })
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type specified' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalRequested: ids.length,
        deleted: results.deleted.length,
        skipped: results.skipped.length,
        errors: results.errors.length,
      },
    })
  } catch (error) {
    console.error('Error deleting local items:', error)
    
    if (error instanceof Error && error.message.includes('Access denied')) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to delete local items' },
      { status: 500 }
    )
  }
}
