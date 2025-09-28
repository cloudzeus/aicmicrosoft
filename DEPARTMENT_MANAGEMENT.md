# Department Management System

This document describes the comprehensive department management system implemented in the AIC CRM application.

## Overview

The system extends the existing Auth.js user management with hierarchical department structures, position assignments, and SharePoint integration.

## Database Schema

### Extended User Model
```typescript
model User {
  // ... existing fields
  phone            String?
  mobile           String?
  extension        String?
  aadObjectId      String?   @unique
  tenantId         String?
  jobTitle         String?
  departmentExport Json?     // Raw data from Graph
  // ... relationships
}
```

### New Models

#### Department
- Hierarchical structure with self-references
- Optional manager assignment
- Unique department codes

#### Position
- Belongs to a department
- Multiple users can hold the same position

#### UserDepartment (Join Table)
- Many-to-many relationship between users and departments
- Primary department flag
- Assignment timestamps

#### UserPosition (Join Table)
- Many-to-many relationship between users and positions
- Assignment timestamps

#### DepartmentSharePoint
- SharePoint site associations per department
- Access level management (READ, CONTRIBUTE, OWNER)

## API Endpoints

### Departments
- `GET /api/departments` - List departments with filtering
- `POST /api/departments` - Create new department
- `GET /api/departments/[id]` - Get specific department
- `PUT /api/departments/[id]` - Update department
- `DELETE /api/departments/[id]` - Delete department
- `GET /api/departments/hierarchy` - Get department hierarchy tree

### Positions
- `GET /api/positions` - List positions with filtering
- `POST /api/positions` - Create new position
- `GET /api/positions/[id]` - Get specific position
- `PUT /api/positions/[id]` - Update position
- `DELETE /api/positions/[id]` - Delete position

### SharePoint Sites
- `GET /api/sharepoints` - List all SharePoint sites
- `GET /api/departments/[departmentId]/sharepoints` - List department SharePoint sites
- `POST /api/departments/[departmentId]/sharepoints` - Create SharePoint site
- `GET /api/departments/[departmentId]/sharepoints/[id]` - Get specific SharePoint site
- `PUT /api/departments/[departmentId]/sharepoints/[id]` - Update SharePoint site
- `DELETE /api/departments/[departmentId]/sharepoints/[id]` - Delete SharePoint site

### User Assignments
- `GET /api/users/[userId]/departments` - Get user's department assignments
- `POST /api/users/[userId]/departments` - Assign user to department
- `PUT /api/users/[userId]/departments/[departmentId]` - Update department assignment
- `DELETE /api/users/[userId]/departments/[departmentId]` - Remove user from department
- `GET /api/users/[userId]/positions` - Get user's position assignments
- `POST /api/users/[userId]/positions` - Assign user to position
- `DELETE /api/users/[userId]/positions/[positionId]` - Remove user from position
- `GET /api/users/assignments` - Get user assignments overview

## Authentication & Authorization

### Helper Functions

#### `getCurrentUser()`
Returns the current authenticated user with all related data (departments, positions, managed departments).

#### `requireAccess({ action, resource })`
Enforces role-based access control:
- **ADMIN**: Full access to all resources
- **MANAGER**: Access to managed departments (TODO: to be implemented)
- **USER**: Access to own data and assigned departments (TODO: to be implemented)

### Access Levels
- `read` - View data
- `write` - Create/update data
- `delete` - Remove data
- `admin` - Administrative operations

## Seeding

The system includes a comprehensive seed script that creates:

### Departments
- Sales, Presales, Accounting, Technical, Support, HR, Operations

### Positions (per department)
- **Sales**: Sales Rep, Sales Lead
- **Presales**: Solutions Engineer, Bid Manager
- **Accounting**: Accountant, AP/AR Specialist
- **Technical**: Network Engineer, Field Engineer, SysAdmin
- **Support**: Helpdesk L1, Helpdesk L2
- **HR**: HR Generalist, Recruiter
- **Operations**: Project Manager, Operations Coordinator

### SharePoint Sites
- 1-2 placeholder SharePoint sites per department with READ access

### Admin User
- Email: `gkozyris@aic.gr`
- Role: ADMIN
- Demo contact information

## Usage

### Database Setup
```bash
# Push schema changes
npm run db:push

# Run seed script
npm run db:seed
```

### Server-Side Data Fetching
All secured data should be fetched server-side using Route Handlers or Server Actions. The system enforces this pattern for security and performance.

### Example Usage
```typescript
// Server-side only
import { getCurrentUser, requireAccess } from '@/lib/auth-helpers'

export async function GET() {
  await requireAccess({ action: 'read', resource: 'department' })
  const user = await getCurrentUser()
  // ... fetch data
}
```

## Security Features

- All API endpoints require authentication
- Role-based access control
- Input validation with Zod schemas
- Protection against circular department references
- Cascade delete protection (cannot delete departments with users/positions)

## Future Enhancements

The system includes TODO markers for future implementations:
- Manager-level access rules
- User-level access rules based on department memberships
- Advanced permission management
- Audit logging for assignment changes

## Error Handling

All endpoints include comprehensive error handling:
- Authentication errors (403)
- Validation errors (400)
- Not found errors (404)
- Server errors (500)

The system provides detailed error messages for debugging while maintaining security.
