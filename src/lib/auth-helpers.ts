import { auth } from './auth'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

export interface AccessRequirement {
  action: 'read' | 'write' | 'delete' | 'admin'
  resource?: 'department' | 'position' | 'sharepoint' | 'user'
}

export interface UserWithRelations {
  id: string
  name: string | null
  email: string
  role: UserRole
  phone: string | null
  mobile: string | null
  extension: string | null
  aadObjectId: string | null
  tenantId: string | null
  jobTitle: string | null
  departmentExport: unknown
  createdAt: Date
  updatedAt: Date
  userDepartments: Array<{
    id: string
    isPrimary: boolean
    assignedAt: Date
    department: {
      id: string
      name: string
      code: string
      description: string | null
      parentId: string | null
      managerId: string | null
    }
  }>
  userPositions: Array<{
    id: string
    assignedAt: Date
    position: {
      id: string
      name: string
      description: string | null
      department: {
        id: string
        name: string
        code: string
      }
    }
  }>
  managedDepartments: Array<{
    id: string
    name: string
    code: string
    description: string | null
  }>
}

/**
 * Get the current authenticated user with all related data
 * This function should only be used on the server side
 */
export async function getCurrentUser(): Promise<UserWithRelations | null> {
  try {
    const session = await auth()
    
    console.log('getCurrentUser - session:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userEmail: session?.user?.email,
      sessionRole: session?.user?.role
    })
    
    if (!session?.user?.email) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        userDepartments: {
          include: {
            department: true,
          },
        },
        userPositions: {
          include: {
            position: {
              include: {
                department: true,
              },
            },
          },
        },
        managedDepartments: true,
      },
    })

    console.log('getCurrentUser - db user:', {
      found: !!user,
      role: user?.role,
      email: user?.email
    })

    return user
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Check if the current user has the required access level
 * This function should only be used on the server side
 */
export async function requireAccess(
  requirement: AccessRequirement
): Promise<UserWithRelations> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  console.log('requireAccess - user role:', user.role, 'requirement:', requirement)
  
  // Admin users have full access to everything
  if (user.role === 'ADMIN') {
    return user
  }
  
  // TEMPORARY: Also check session role as fallback
  // This handles cases where database role doesn't match session role
  const session = await auth()
  if (session?.user?.role === 'ADMIN') {
    console.log('Using session role ADMIN as fallback')
    return user
  }

  // TODO: Implement manager-level access rules
  // Managers should have access to their managed departments and subordinates
  if (user.role === 'MANAGER') {
    // For now, allow managers to read their managed departments
    if (requirement.action === 'read' && requirement.resource) {
      return user
    }
    
    // TODO: Implement write/delete permissions for managers
    // based on their managed departments
  }

  // TODO: Implement user-level access rules
  // Users should have access to their own data and departments they belong to
  if (user.role === 'USER') {
    if (requirement.action === 'read' && requirement.resource) {
      return user
    }
    
    // TODO: Implement limited write permissions for users
    // based on their department memberships
  }

  // TEMPORARY: Allow all authenticated users to have write access for testing
  // TODO: Implement proper role-based access control
  if (requirement.action === 'write' && (requirement.resource === 'user' || requirement.resource === 'position')) {
    console.log('Temporarily allowing write access for user/position operations')
    return user
  }

  // If we reach here, access is denied
  throw new Error(`Access denied: ${requirement.action} on ${requirement.resource || 'resource'}`)
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'ADMIN'
}

/**
 * Check if user is manager
 */
export async function isManager(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'MANAGER'
}

/**
 * Get user's department IDs (including managed departments)
 */
export async function getUserDepartmentIds(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  
  const userDeptIds = user.userDepartments.map(ud => ud.department.id)
  const managedDeptIds = user.managedDepartments.map(d => d.id)
  
  return [...new Set([...userDeptIds, ...managedDeptIds])]
}

/**
 * Check if user belongs to a specific department
 */
export async function userBelongsToDepartment(departmentId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  return user.userDepartments.some(ud => ud.department.id === departmentId) ||
         user.managedDepartments.some(d => d.id === departmentId)
}

/**
 * Check if user manages a specific department
 */
export async function userManagesDepartment(departmentId: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  return user.managedDepartments.some(d => d.id === departmentId)
}
