
import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export const metadata: Metadata = {
  title: 'Admin Panel | Yamaha Blue Streaks',
  description: 'Manage users, rides, and system settings for Yamaha Blue Streaks.',
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // TODO: Implement robust authentication and authorization for admin access
  // This layout should only be accessible to authenticated admin users.
  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar />
      <main className="flex-grow p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
