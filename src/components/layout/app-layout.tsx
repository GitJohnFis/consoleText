
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, User } from 'lucide-react'; // Added User icon

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  useSidebar, // Import useSidebar to get collapse state
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Added Input component
import { LogoIcon } from '@/components/icons/logo-icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsMobile as useIsMobileHook } from '@/hooks/use-mobile'; 

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/recipients', label: 'Recipients', icon: Users },
  // { href: '/settings', label: 'Settings', icon: Settings }, // Example for future use
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMobileLayout = useIsMobileHook(); 
  
  // We need to wrap the core layout with SidebarProvider so useSidebar can be called
  const InnerLayout = () => {
    const { state: sidebarState, isMobile } = useSidebar(); // Get sidebar state
    const isSidebarCollapsed = sidebarState === 'collapsed' && !isMobile;

    return (
      <>
        <Sidebar variant="sidebar" collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon
                showText={!isSidebarCollapsed}
                className={`h-8 text-sidebar-primary ${!isSidebarCollapsed ? 'w-[10.83rem]' : 'w-8'}`}
              />
              {/* H1 is removed as LogoIcon now includes the text */}
            </Link>
          </SidebarHeader>
          <ScrollArea className="flex-1">
            <SidebarContent>
              <SidebarMenu className="p-2">
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} legacyBehavior passHref>
                      <SidebarMenuButton
                        isActive={pathname === item.href}
                        tooltip={{ children: item.label, className: "group-data-[collapsible=icon]:block hidden" }}
                        className="justify-start"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
          </ScrollArea>
          <SidebarFooter className="p-2 border-t border-sidebar-border">
            <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden mb-2">
              <Input 
                type="text" 
                placeholder="User ID" 
                className="h-8 bg-sidebar-accent border-sidebar-border placeholder:text-sidebar-foreground/60 text-sidebar-foreground text-sm" 
              />
              <Input 
                type="password" 
                placeholder="API Key" 
                className="h-8 bg-sidebar-accent border-sidebar-border placeholder:text-sidebar-foreground/60 text-sidebar-foreground text-sm" 
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:p-0"
                >
                  <User className="h-5 w-5" />
                  <span className="group-data-[collapsible=icon]:hidden">
                    User Settings
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-background">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:justify-end">
            <SidebarTrigger className="sm:hidden" />
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </>
    );
  }
  
  return (
    <SidebarProvider defaultOpen={!isMobileLayout} open={isMobileLayout ? false : undefined}>
      <InnerLayout />
    </SidebarProvider>
  );
}
