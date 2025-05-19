
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bike, LayoutDashboard, Users, Bell, ShieldCheck, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Management', icon: Users },
  { href: '/admin/rides', label: 'Ride Management', icon: Bike },
  // { href: '/admin/rides/approval', label: 'Ride Approval', icon: ShieldCheck },
  // { href: '/admin/rides/statistics', label: 'Ride Statistics', icon: BarChart3 },
  { href: '/admin/alerts', label: 'System Alerts', icon: Bell },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-card text-card-foreground border-r border-border p-4 space-y-6 hidden md:flex flex-col shadow-md">
      <Link href="/admin" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors px-2">
        <Bike className="h-7 w-7" />
        <span className="font-bold text-lg">Admin Panel</span>
      </Link>
      
      <nav className="flex-grow">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
