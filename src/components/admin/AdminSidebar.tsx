
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, LayoutDashboard, Users, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

// TODO: Replace this with actual role checking from your auth system
async function fetchUserRole(): Promise<{ isAdmin: boolean }> {
  // Placeholder: Simulate fetching user role.
  // In a real app, this might involve:
  // - Checking a client-side auth state (e.g., from Context or Zustand store that was populated after login)
  // - Or, if AdminSidebar is part of a server-protected layout, this info might be passed as a prop.
  // - Or, making a fetch call to an API endpoint like '/api/auth/me' that returns user roles.
  console.warn("SECURITY WARNING: AdminSidebar fetchUserRole is a placeholder and always returns isAdmin: true. IMPLEMENT REAL ROLE CHECKING.");
  return { isAdmin: true }; // REMOVE/REPLACE
}


const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { href: '/admin/users', label: 'User Management', icon: Users, adminOnly: true },
  { href: '/admin/rides', label: 'Ride Management', icon: Bike, adminOnly: true },
  { href: '/admin/alerts', label: 'System Alerts', icon: Bell, adminOnly: true },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      setIsLoading(true);
      const role = await fetchUserRole();
      setIsAdmin(role.isAdmin);
      setIsLoading(false);
    }
    checkRole();
  }, []);

  if (isLoading) {
    // Optional: Add a loading skeleton for the sidebar
    return (
      <aside className="w-64 bg-card text-card-foreground border-r border-border p-4 space-y-6 hidden md:flex flex-col shadow-md">
        <div className="flex items-center gap-2 text-primary px-2">
          <Bike className="h-7 w-7 animate-pulse" />
          <span className="font-bold text-lg">Admin Panel</span>
        </div>
        <div className="flex-grow space-y-2 mt-4">
          <div className="h-8 bg-muted rounded animate-pulse"></div>
          <div className="h-8 bg-muted rounded animate-pulse"></div>
          <div className="h-8 bg-muted rounded animate-pulse"></div>
        </div>
      </aside>
    );
  }

  // If not admin, you could render null or a message, 
  // but primary protection should be at the layout/route level.
  // This client-side check is more for conditionally rendering UI elements.
  if (!isAdmin) {
     console.log("Current user is not an admin, sidebar will not render full nav.");
     // return null; // Or a restricted view if non-admins can see a different sidebar
  }


  return (
    <aside className="w-64 bg-card text-card-foreground border-r border-border p-4 space-y-6 hidden md:flex flex-col shadow-md">
      <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-2">
        <Bike className="h-7 w-7" />
        <span className="font-bold text-lg">Admin Panel</span>
      </Link>
      
      <nav className="flex-grow">
        <ul className="space-y-1">
          {navItems.map((item) => {
            // Conditionally render items based on adminOnly flag and user's admin status
            if (item.adminOnly && !isAdmin) {
              return null;
            }
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'hover:bg-muted hover:text-muted-foreground',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div>
        <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors block text-center p-2 hover:bg-muted rounded-md">
          Back to Main Site
        </Link>
      </div>
    </aside>
  );
}
