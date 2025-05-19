
import type { Metadata } from 'next';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
// TODO: Import your actual session/auth checking utility
// import { getSession, isAdminUser } from '@/lib/auth'; // Example
// import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin Panel | Yamaha Blue Streaks',
  description: 'Manage users, rides, and system settings for Yamaha Blue Streaks.',
};

export default async function AdminLayout({ // Made async for potential server-side auth checks
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // --- TODO: Implement robust SERVER-SIDE authentication and authorization ---
  // This layout should only be accessible to authenticated admin users.
  // Example (you'll need to adapt this to your auth system):
  // const session = await getSession(); // Your function to get current session/user
  // if (!session || !isAdminUser(session.user)) {
  //   redirect('/auth/login?error=AdminAccessRequired'); // Or to a "not authorized" page
  // }
  // For now, we'll proceed. REMOVE/REPLACE THIS IN PRODUCTION.
  console.warn("SECURITY WARNING: AdminLayout does not have real authentication/authorization checks. All /admin routes are currently open if URL is known.");
  // --- End Server-Side Admin Authentication/Authorization ---

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AdminSidebar /> {/* AdminSidebar can also fetch user role to conditionally render items */}
      <main className="flex-grow p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
