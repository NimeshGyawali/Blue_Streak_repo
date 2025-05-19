
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Bike, Bell, BarChart3 } from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Admin Dashboard" description="Overview and quick access to management tools." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">User Management</CardTitle>
            <Users className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Verify new users and manage existing accounts.</CardDescription>
            <Button asChild variant="outline">
              <Link href="/admin/users">Go to User Management</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Ride Management</CardTitle>
            <Bike className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Approve new rides, view ride statistics, and manage ride details.</CardDescription>
            <Button asChild variant="outline">
              <Link href="/admin/rides">Go to Ride Management</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">System Alerts</CardTitle>
            <Bell className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Review system notifications and important alerts.</CardDescription>
            <Button asChild variant="outline">
              <Link href="/admin/alerts">View Alerts</Link>
            </Button>
          </CardContent>
        </Card>

         <Card className="shadow-lg hover:shadow-xl transition-shadow md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Ride Statistics</CardTitle>
            <BarChart3 className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <CardDescription className="mb-4">Analyze ride data, participation, and trends.</CardDescription>
             {/* Link to be updated if stats get their own page or section */}
            <Button asChild variant="outline" disabled> 
              <Link href="/admin/rides#statistics">View Ride Statistics</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      {/* TODO: Add more dashboard widgets like recent activity, quick stats, etc. */}
    </div>
  );
}
