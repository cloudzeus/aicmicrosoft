# Sync Management System

This document describes the comprehensive sync management system that distinguishes between items from Microsoft Office 365 tenant sync versus locally created items, and provides the ability to manage and delete non-synced items.

## Overview

The system extends the existing department management with sync status tracking and provides administrators with tools to:
- View all items (users, departments, positions, SharePoint sites) with their sync status
- Identify which items come from Office 365 tenant sync vs locally created
- Delete locally created items that are not synced from the tenant
- Manage sync status across all entities

## Database Schema Extensions

### Sync Status Fields Added

All relevant models now include sync tracking fields:

```prisma
model User {
  // ... existing fields
  isFromTenantSync Boolean   @default(false)  // Track if synced from Microsoft Graph
  // ... other fields
}

model Department {
  // ... existing fields
  isFromTenantSync Boolean @default(false)  // Track if synced from Microsoft Graph
  tenantId        String?   // Microsoft Graph ID if synced
  // ... other fields
}

model Position {
  // ... existing fields
  isFromTenantSync Boolean @default(false)  // Track if synced from Microsoft Graph
  tenantId         String?   // Microsoft Graph ID if synced
  // ... other fields
}

model DepartmentSharePoint {
  // ... existing fields
  isFromTenantSync Boolean @default(false)  // Track if synced from Microsoft Graph
  tenantSiteId     String?     // Microsoft Graph Site ID if synced
  // ... other fields
}
```

## API Endpoints

### Sync Status Management

#### `GET /api/management/sync-status`
Returns comprehensive sync status of all items.

**Query Parameters:**
- `includeTenantData` (boolean): Whether to fetch current tenant data from Microsoft Graph

**Response:**
```json
{
  "local": {
    "users": [...],
    "departments": [...],
    "positions": [...],
    "sharePoints": [...]
  },
  "tenant": {
    "users": [...],
    "sharePointSites": [...]
  },
  "statistics": {
    "users": { "total": 10, "fromTenantSync": 8, "local": 2 },
    "departments": { "total": 7, "fromTenantSync": 0, "local": 7 },
    "positions": { "total": 15, "fromTenantSync": 0, "local": 15 },
    "sharePoints": { "total": 14, "fromTenantSync": 0, "local": 14 }
  }
}
```

#### `POST /api/management/delete-local`
Deletes local (non-tenant-synced) items.

**Request Body:**
```json
{
  "type": "user" | "department" | "position" | "sharepoint",
  "ids": ["id1", "id2", "id3"]
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "deleted": ["id1", "id3"],
    "skipped": ["id2"],
    "errors": []
  },
  "summary": {
    "totalRequested": 3,
    "deleted": 2,
    "skipped": 1,
    "errors": 0
  }
}
```

## Management Dashboard

### Access
- **URL:** `/management`
- **Access Level:** Admin only
- **Navigation:** Available in sidebar under "Administration" section for admin users

### Features

#### 1. Sync Status Overview
- Statistics cards showing total counts and breakdown by sync status
- Real-time sync status indicators:
  - 🟢 **Office 365** - Items synced from Microsoft Graph
  - 🔵 **Local** - Items created locally in the database

#### 2. Item Management Tabs
- **Users:** View and manage user accounts
- **Departments:** View and manage organizational departments
- **Positions:** View and manage job positions
- **SharePoint:** View and manage SharePoint site associations

#### 3. Bulk Operations
- **Select All Local:** Select all locally created items for deletion
- **Delete Selected:** Remove selected local items (tenant-synced items are protected)
- **Search:** Filter items by name, email, code, or other relevant fields

#### 4. Visual Indicators
- Sync status badges on all items
- Color-coded indicators:
  - Green badges for Office 365 synced items
  - Gray badges for local items
- Checkbox selection (disabled for tenant-synced items)

#### 5. Safety Features
- **Protected Items:** Tenant-synced items cannot be selected for deletion
- **Dependency Checks:** Items with dependencies (users assigned, child departments, etc.) cannot be deleted
- **Confirmation Dialogs:** Clear feedback on deletion results
- **Error Handling:** Detailed error messages for failed operations

## Visual Indicators in Existing Components

### User Components
- **Tenant Users List:** Shows sync status badges next to user information
- **User Cards:** Display Office 365 vs Local indicators

### SharePoint Components
- **SharePoint Browser:** Shows sync status for each site
- **Site Cards:** Display whether sites are from tenant sync or locally managed

### Department Management
- **Department Lists:** Show sync status for all departments
- **Position Management:** Indicate which positions are synced vs local

## Usage Examples

### 1. Identifying Sync Status
```typescript
// Check if an item is from tenant sync
const isFromTenant = user.isFromTenantSync

// Get tenant ID for synced items
const tenantId = department.tenantId
```

### 2. Safe Deletion
```typescript
// Only delete local items
if (!item.isFromTenantSync) {
  await deleteItem(item.id)
}
```

### 3. Sync Status Display
```jsx
<Badge variant={item.isFromTenantSync ? "default" : "secondary"}>
  {item.isFromTenantSync ? "Office 365" : "Local"}
</Badge>
```

## Security & Access Control

### Authentication
- All management endpoints require authentication
- Admin role required for access to management dashboard

### Authorization
- Role-based access control (RBAC) enforced
- Only ADMIN users can access management features
- Tenant-synced items are protected from deletion

### Data Protection
- Tenant-synced items cannot be accidentally deleted
- Dependency checks prevent orphaned data
- Audit trail for all management operations

## Error Handling

### Common Error Scenarios
1. **Access Denied:** User lacks admin privileges
2. **Item Not Found:** Requested item doesn't exist
3. **Dependency Conflict:** Item has dependent relationships
4. **Tenant Sync Protection:** Attempt to delete tenant-synced item

### Error Response Format
```json
{
  "error": "Error description",
  "details": "Additional error information"
}
```

## Future Enhancements

### Planned Features
1. **Sync Scheduling:** Automatic sync from Office 365
2. **Conflict Resolution:** Handle conflicts between tenant and local data
3. **Bulk Import:** Import tenant data into local database
4. **Audit Logging:** Track all sync and management operations
5. **Selective Sync:** Choose which tenant data to sync

### Integration Opportunities
1. **Microsoft Graph Webhooks:** Real-time sync updates
2. **PowerShell Integration:** Bulk operations via PowerShell
3. **Reporting:** Sync status reports and analytics
4. **Notifications:** Alerts for sync issues or conflicts

## Troubleshooting

### Common Issues

#### 1. Items Not Showing Sync Status
- **Cause:** Items created before sync tracking was implemented
- **Solution:** Update existing items to set `isFromTenantSync` field

#### 2. Cannot Delete Local Items
- **Cause:** Items have dependencies or relationships
- **Solution:** Remove dependencies first (users, child departments, etc.)

#### 3. Management Dashboard Not Accessible
- **Cause:** User lacks admin role
- **Solution:** Update user role to ADMIN in database

### Database Queries

#### Check Sync Status Distribution
```sql
SELECT 
  'users' as type,
  COUNT(*) as total,
  SUM(CASE WHEN isFromTenantSync = true THEN 1 ELSE 0 END) as from_tenant,
  SUM(CASE WHEN isFromTenantSync = false THEN 1 ELSE 0 END) as local
FROM User
UNION ALL
SELECT 
  'departments' as type,
  COUNT(*) as total,
  SUM(CASE WHEN isFromTenantSync = true THEN 1 ELSE 0 END) as from_tenant,
  SUM(CASE WHEN isFromTenantSync = false THEN 1 ELSE 0 END) as local
FROM Department;
```

#### Find Items Without Sync Status
```sql
SELECT id, name, email FROM User WHERE isFromTenantSync IS NULL;
```

## Migration Guide

### Updating Existing Data
1. **Set Default Sync Status:** Update existing items to mark them as local
2. **Add Tenant IDs:** For items that should be marked as synced, add appropriate tenant IDs
3. **Verify Relationships:** Ensure all relationships are properly maintained

### Example Migration Script
```sql
-- Mark all existing items as local (not from tenant sync)
UPDATE User SET isFromTenantSync = false WHERE isFromTenantSync IS NULL;
UPDATE Department SET isFromTenantSync = false WHERE isFromTenantSync IS NULL;
UPDATE Position SET isFromTenantSync = false WHERE isFromTenantSync IS NULL;
UPDATE DepartmentSharePoint SET isFromTenantSync = false WHERE isFromTenantSync IS NULL;
```

This sync management system provides comprehensive visibility and control over data sources, ensuring administrators can safely manage their organizational data while protecting tenant-synced information.
