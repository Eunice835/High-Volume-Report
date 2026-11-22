import { Link, useLocation } from "wouter";
import { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Download, 
  Settings, 
  Activity, 
  Database, 
  Bell,
  User,
  Menu,
  Shield,
  X,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import generatedImage from '@assets/generated_images/abstract_high-tech_data_visualization_background_with_dark_blue_and_cyan_themes.png';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout, hasRole } = useAuth();
  const [_, setLocation] = useLocation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background text-foreground relative overflow-hidden">
         {/* Background Overlay */}
        <div 
            className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen"
            style={{
                backgroundImage: `url(${generatedImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        />

        <Sidebar className="border-r border-border bg-sidebar/50 backdrop-blur-xl z-20">
          <SidebarHeader className="p-4 border-b border-border/50">
            <div className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold tracking-tight">Ira</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Analytics</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton isActive={location === "/"} tooltip="Dashboard" className="h-10">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/reports">
                  <SidebarMenuButton isActive={location === "/reports"} tooltip="Reports" className="h-10">
                    <FileText className="mr-2 h-4 w-4" />
                    <span>Report Generator</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/exports">
                  <SidebarMenuButton isActive={location === "/exports"} tooltip="Exports" className="h-10">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export Center</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>

            {hasRole("admin") && (
              <SidebarGroup className="mt-4">
                  <SidebarGroupLabel>System</SidebarGroupLabel>
                  <SidebarMenu>
                      <SidebarMenuItem>
                          <Link href="/admin">
                              <SidebarMenuButton isActive={location === "/admin"} tooltip="Admin Console" className="h-10">
                                  <Shield className="mr-2 h-4 w-4" />
                                  <span>Admin Console</span>
                              </SidebarMenuButton>
                          </Link>
                      </SidebarMenuItem>
                  </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border/50">
             <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 border border-border/50">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="flex flex-col">
                  <span className="text-xs font-medium">System Status</span>
                  <span className="text-[10px] text-muted-foreground">Octane Workers: Active</span>
                </div>
             </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
          <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <span className="text-sm text-muted-foreground">High-Volume Reporting Module</span>
            </div>
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b border-border">
                    <h4 className="font-medium text-sm">Notifications</h4>
                  </div>
                  <div className="divide-y divide-border max-h-[300px] overflow-auto">
                    <div className="p-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Export Completed</p>
                          <p className="text-xs text-muted-foreground">Monthly report is ready for download</p>
                          <p className="text-[10px] text-muted-foreground mt-1">2 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Worker Alert</p>
                          <p className="text-xs text-muted-foreground">3 jobs moved to dead letter queue</p>
                          <p className="text-[10px] text-muted-foreground mt-1">15 minutes ago</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 hover:bg-muted/50 cursor-pointer">
                      <div className="flex items-start gap-3">
                        <Activity className="h-4 w-4 text-primary mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">System Update</p>
                          <p className="text-xs text-muted-foreground">Database indexes optimized</p>
                          <p className="text-[10px] text-muted-foreground mt-1">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full text-xs">View all notifications</Button>
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 border-l border-border/50 pl-4 h-auto py-1" data-testid="button-user-menu">
                    <div className="text-right hidden md:block">
                      <div className="text-xs font-medium">{user?.username || "User"}</div>
                      <div className="text-[10px] text-muted-foreground capitalize">{user?.role || "viewer"}</div>
                    </div>
                    <Avatar className="h-8 w-8 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {user?.username?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user?.username}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      await logout();
                      setLocation("/login");
                    }}
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                    data-testid="button-logout"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="flex-1 overflow-auto p-6 relative">
             {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
