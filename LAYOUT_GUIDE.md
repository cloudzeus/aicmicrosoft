# AIC CRM Layout System Guide

This guide explains how to use the new generic layout system for all pages in the AIC CRM application.

## Overview

The layout system provides a consistent, professional interface with:
- **Sidebar Navigation**: Organized menu with groups and user profile
- **Header**: Page title, description, and status indicators
- **Main Content Area**: Flexible content area for page-specific components
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Components

### 1. AppLayout
The main layout component that provides the sidebar, header, and content structure.

**Location**: `src/components/layout/app-layout.tsx`

**Features**:
- Sidebar with navigation menu groups
- User avatar and dropdown menu at the bottom
- Header with page title and description
- Main content area with proper spacing
- Sign out functionality

### 2. DashboardLayout
A wrapper component that adds authentication checks and loading states.

**Location**: `src/components/layout/dashboard-layout.tsx`

**Features**:
- Automatic authentication redirect
- Loading state while checking session
- Wraps content with AppLayout

## Usage

### For New Pages

```tsx
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default async function MyPage() {
  const session = await auth()

  if (!session) {
    redirect("/auth/signin")
  }

  return (
    <DashboardLayout 
      pageTitle="My Page" 
      pageDescription="Description of what this page does"
    >
      {/* Your page content here */}
      <div>Content goes here</div>
    </DashboardLayout>
  )
}
```

### For Client Components

If you need a client component, use AppLayout directly:

```tsx
"use client"

import { AppLayout } from "@/components/layout/app-layout"

export function MyClientPage() {
  return (
    <AppLayout 
      pageTitle="My Page" 
      pageDescription="Description of what this page does"
    >
      {/* Your page content here */}
      <div>Content goes here</div>
    </AppLayout>
  )
}
```

## Navigation Structure

The sidebar navigation is defined in `app-layout.tsx` and includes:

### Main Navigation Groups
- **Dashboard**: Main dashboard page
- **Communication**: Email, Calendar, Group Calendar
- **Collaboration**: SharePoint, Users
- **Analytics**: Reports, Documents

### Bottom Navigation
- **Settings**: Application settings
- **Help & Support**: Help documentation and support

### User Profile Menu
- Profile information
- Settings access
- Notifications
- Sign out

## Customization

### Adding New Navigation Items

Edit the `navigationItems` array in `src/components/layout/app-layout.tsx`:

```tsx
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Your New Group",
    items: [
      {
        title: "New Page",
        url: "/new-page",
        icon: YourIcon,
      },
    ],
  },
  // ... existing items
]
```

### Styling

The layout uses Tailwind CSS classes and follows the design system:
- **Colors**: Consistent with the existing theme
- **Spacing**: Proper padding and margins
- **Shadows**: Subtle shadows for depth
- **Typography**: Consistent font sizes and weights

## Examples

### Dashboard Page
See `src/app/dashboard/page.tsx` for a complete example with:
- Dashboard overview with stats
- User profile cards
- Quick action buttons

### Settings Page
See `src/app/settings/page.tsx` for a form-based page with:
- Multiple card sections
- Form inputs and controls
- Organized layout

### Help Page
See `src/app/help/page.tsx` for a content-heavy page with:
- Search functionality
- FAQ sections
- Support options

## Responsive Behavior

- **Desktop**: Full sidebar visible
- **Tablet**: Collapsible sidebar
- **Mobile**: Overlay sidebar with sheet

## Authentication

The layout automatically handles:
- Session checking
- Redirect to sign-in if not authenticated
- Loading states during authentication checks

## Best Practices

1. **Always use DashboardLayout** for server components that need authentication
2. **Use AppLayout directly** only for client components or special cases
3. **Provide meaningful page titles and descriptions** for better UX
4. **Keep content organized** in cards and sections
5. **Use consistent spacing** and follow the design system

## Migration

All existing pages have been updated to use the new layout system:
- ✅ Dashboard (`/dashboard`)
- ✅ Email (`/emails`)
- ✅ Calendar (`/calendar`)
- ✅ Group Calendar (`/group-calendar`)
- ✅ SharePoint (`/sharepoint`)
- ✅ Users (`/users`)
- ✅ Settings (`/settings`)
- ✅ Help (`/help`)

The old individual page layouts have been replaced with the consistent layout system.
