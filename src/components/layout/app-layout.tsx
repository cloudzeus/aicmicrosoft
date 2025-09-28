"use client"

import { useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { 
  Home, 
  Mail, 
  Calendar, 
  Users, 
  Share2, 
  Settings, 
  LogOut,
  BarChart3,
  FileText,
  Bell,
  HelpCircle,
  User,
  Building,
  Shield,
  Database,
  Briefcase,
  FolderOpen,
  UserCheck,
  Trash2,
  RefreshCw
} from "lucide-react"

// Navigation items with groups
const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Communication",
    items: [
      {
        title: "Email",
        url: "/emails",
        icon: Mail,
      },
      {
        title: "Calendar",
        url: "/calendar",
        icon: Calendar,
      },
      {
        title: "Group Calendar",
        url: "/group-calendar",
        icon: Users,
      },
    ],
  },
  {
    title: "Collaboration",
    items: [
      {
        title: "SharePoint",
        url: "/sharepoint",
        icon: Share2,
      },
      {
        title: "Users",
        url: "/users",
        icon: Users,
      },
    ],
  },
  {
    title: "Analytics",
    items: [
      {
        title: "Reports",
        url: "/reports",
        icon: BarChart3,
      },
      {
        title: "Documents",
        url: "/documents",
        icon: FileText,
      },
    ],
  },
  {
    title: "Management",
    items: [
      {
        title: "Sync Management",
        url: "/management",
        icon: RefreshCw,
      },
      {
        title: "Departments",
        url: "/management/departments",
        icon: Building,
      },
      {
        title: "Positions",
        url: "/management/positions",
        icon: Briefcase,
      },
      {
        title: "User Assignments",
        url: "/management/assignments",
        icon: UserCheck,
      },
      {
        title: "SharePoint Sites",
        url: "/management/sharepoints",
        icon: FolderOpen,
      },
      {
        title: "Database Tools",
        url: "/management/database",
        icon: Database,
      },
    ],
  },
]

// Bottom navigation items
const bottomNavigationItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Help & Support",
    url: "/help",
    icon: HelpCircle,
  },
]

// Admin-only navigation items
const adminNavigationItems = [
  {
    title: "Management",
    url: "/management",
    icon: Shield,
    description: "Manage sync status and local items",
  },
]

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle?: string
  pageDescription?: string
}

export function AppLayout({ children, pageTitle = "Dashboard", pageDescription }: AppLayoutProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => 
      item.url === pathname || 
      item.items?.some(subItem => subItem.url === pathname)
    )
    return currentItem?.title || pageTitle
  }

  const getPageDescription = () => {
    if (pageDescription) return pageDescription
    
    const currentItem = navigationItems.find(item => 
      item.url === pathname || 
      item.items?.some(subItem => subItem.url === pathname)
    )
    
    if (currentItem?.items) {
      const subItem = currentItem.items.find(subItem => subItem.url === pathname)
      return subItem ? `Manage your ${subItem.title.toLowerCase()}` : `Access ${currentItem.title.toLowerCase()} features`
    }
    
    return `Welcome to your ${getPageTitle().toLowerCase()}`
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 48)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Sidebar>
        <SidebarHeader className="border-b p-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600">
              <Building className="h-3 w-3 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold">AIC CRM</h2>
              <p className="text-xs text-muted-foreground">Microsoft 365</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-auto">
          {/* Main Navigation */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item, index) => (
                  <div key={index}>
                    {item.url ? (
                      // Single item
                      <SidebarMenuItem>
                        <SidebarMenuButton 
                          asChild 
                          isActive={pathname === item.url}
                          className="w-full justify-start"
                        >
                          <Link href={item.url}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ) : (
                      // Group with sub-items
                      <>
                        <SidebarMenuItem>
                          <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        </SidebarMenuItem>
                        {item.items?.map((subItem, subIndex) => (
                          <SidebarMenuItem key={subIndex}>
                            <SidebarMenuButton 
                              asChild 
                              isActive={pathname === subItem.url}
                              className="w-full justify-start"
                            >
                              <Link href={subItem.url}>
                                <subItem.icon className="h-4 w-4" />
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Admin Navigation */}
          {session?.user?.role === 'ADMIN' && (
            <SidebarGroup className="mt-auto">
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavigationItems.map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.url}
                        className="w-full justify-start"
                        title={item.description}
                      >
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Bottom Navigation */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {bottomNavigationItems.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === item.url}
                      className="w-full justify-start"
                    >
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* User Profile Footer */}
        <SidebarFooter className="border-t p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full justify-start p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                    <AvatarFallback className="text-xs">
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium truncate">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer"
                onClick={async () => {
                  if (isSigningOut) return
                  
                  setIsSigningOut(true)
                  try {
                    await signOut({ 
                      callbackUrl: "/auth/signin",
                      redirect: true 
                    })
                  } catch (error) {
                    console.error('Sign out error:', error)
                    // Fallback: redirect manually
                    window.location.href = '/auth/signin'
                  } finally {
                    setIsSigningOut(false)
                  }
                }}
                disabled={isSigningOut}
              >
                <LogOut className={`mr-2 h-4 w-4 ${isSigningOut ? 'animate-spin' : ''}`} />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <div>
              <h1 className="text-lg font-semibold">
                {getPageTitle()}
              </h1>
              <p className="text-xs text-muted-foreground">
                {getPageDescription()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-auto px-3">
            <Badge variant="outline" className="text-xs">
              Online
            </Badge>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
