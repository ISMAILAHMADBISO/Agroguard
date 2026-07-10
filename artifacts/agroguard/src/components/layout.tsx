/**
 * AppLayout — persistent shell wrapping all dashboard pages.
 *
 * Structure:
 *   <SidebarProvider>
 *     <Sidebar>   — brand + navigation links (role-aware)
 *     <main area> — top header + page content slot
 *
 * RBAC visibility:
 *   - Farmers see a dedicated "My Farm" nav; staff-type users see the platform nav
 *   - "Administration" section (sidebar) is visible to super_admin/admin only
 *   - Scope badge appears for staff ("My Assignments Only") and farmer ("My Farm Only") sessions
 *   - Admin badge appears for super_admin/admin sessions
 */
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  Cpu,
  Bell,
  Lightbulb,
  UsersRound,
  LineChart,
  LogOut,
  User,
  ShieldCheck,
  KeyRound,
  ScanLine,
  Bot,
} from "lucide-react";

/** Human-readable role labels */
const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  agronomist: "Agronomist",
  staff: "Staff",
  farmer: "Farmer",
};

function NavLink({ href, icon: Icon, children, isActive }: { href: string; icon: any; children: React.ReactNode; isActive: boolean }) {
  const { setOpenMobile, isMobile } = useSidebar();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} onClick={() => isMobile && setOpenMobile(false)}>
        <Link href={href}>
          <Icon className="mr-2 h-4 w-4" /> {children}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const isAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isScopedStaff = user?.role === "staff";
  const isFarmer = user?.userType === "farmer";

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <Sidebar className="border-r border-sidebar-border">
          <SidebarHeader className="h-16 flex items-center px-4 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-sidebar-foreground">
              {/* Brand logo */}
              <img
                src="/agroguard-logo.png"
                alt="AgroGuard"
                className="h-9 w-9 object-contain"
              />
              <span>AgroGuard</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            {isFarmer ? (
              <SidebarGroup>
                <SidebarGroupLabel>My Farm</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <NavLink href="/my-farm" icon={LayoutDashboard} isActive={location === "/my-farm"}>
                      Overview
                    </NavLink>
                    <NavLink href="/crop-diagnosis" icon={ScanLine} isActive={location === "/crop-diagnosis"}>
                      Crop Diagnosis
                    </NavLink>
                    <NavLink href="/ai-assistant" icon={Bot} isActive={location === "/ai-assistant"}>
                      AI Assistant
                    </NavLink>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ) : (
              <>
                <SidebarGroup>
                  <SidebarGroupLabel>Platform</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      <NavLink href="/dashboard" icon={LayoutDashboard} isActive={location === "/dashboard"}>
                        Dashboard
                      </NavLink>
                      <NavLink href="/farmers" icon={Users} isActive={location.startsWith("/farmers")}>
                        Farmers
                      </NavLink>
                      <NavLink href="/devices" icon={Cpu} isActive={location.startsWith("/devices")}>
                        Devices
                      </NavLink>
                      <NavLink href="/alerts" icon={Bell} isActive={location === "/alerts"}>
                        Alerts
                      </NavLink>
                      <NavLink href="/recommendations" icon={Lightbulb} isActive={location === "/recommendations"}>
                        Recommendations
                      </NavLink>
                      <NavLink href="/crop-diagnosis" icon={ScanLine} isActive={location === "/crop-diagnosis"}>
                        Crop Diagnosis
                      </NavLink>
                      <NavLink href="/ai-assistant" icon={Bot} isActive={location === "/ai-assistant"}>
                        AI Assistant
                      </NavLink>
                      <NavLink href="/analytics" icon={LineChart} isActive={location === "/analytics"}>
                        Analytics
                      </NavLink>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Team section — all internal staff can manage staff accounts */}
                {!isFarmer && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Administration</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <NavLink href="/staff" icon={UsersRound} isActive={location === "/staff"}>
                          Staff
                        </NavLink>
                        {isAdmin && (
                          <NavLink href="/achievements" icon={Lightbulb} isActive={location === "/achievements"}>
                            Achievements
                          </NavLink>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}
              </>
            )}
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top header */}
          <header className="h-16 flex items-center justify-between px-4 border-b bg-card text-card-foreground">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-2" />
              <h1 className="font-semibold text-lg capitalize">
                {location.split("/")[1] || "Dashboard"}
              </h1>

              {/* Role scope badges */}
              {(isScopedStaff || isFarmer) && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5">
                  {isFarmer ? "My Farm Only" : "My Assignments Only"}
                </span>
              )}
              {isAdmin && (
                <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2.5 py-0.5">
                  <ShieldCheck className="h-3 w-3" /> Admin
                </span>
              )}
            </div>

            {/* User dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors focus:outline-none">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ROLE_LABELS[user.role] ?? user.role}
                      </p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <User className="mr-2 h-4 w-4" />
                    <span>{ROLE_LABELS[user.role] ?? user.role}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/change-password">
                      <KeyRound className="mr-2 h-4 w-4" />
                      <span>Change Password</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
