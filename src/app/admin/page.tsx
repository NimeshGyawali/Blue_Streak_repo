
'use client';

import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Bike, Bell, BarChart3, TrendingUp, UsersRound, Activity, AlertTriangle as AlertTriangleIcon, ShieldAlert } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';


// --- Data Structures (mirror what backend APIs will return) ---
interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingUserVerifications: number;
  totalRides: number;
  upcomingRides: number;
  pendingRideApprovals: number;
  activeSystemAlerts: number;
}

interface RecentRideActivity {
  id: string;
  name: string;
  status: 'Ongoing' | 'Upcoming' | 'Recently Completed';
  participantsCount: number;
  startTime?: string;
  captain: string;
}

interface MonthlyRideStats {
  month: string;
  rides: number;
}

interface ChapterActivity {
  id: string;
  name: string;
  ridesThisMonth: number;
  membersCount: number;
  isBelowThreshold: boolean;
}

const MIN_MONTHLY_RIDES_THRESHOLD = 2; // Example threshold (should match backend if hardcoded)

// --- End Data ---

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRides, setRecentRides] = useState<RecentRideActivity[]>([]);
  const [monthlyRideData, setMonthlyRideData] = useState<MonthlyRideStats[]>([]);
  const [chapterActivity, setChapterActivity] = useState<ChapterActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  async function fetchDashboardData() {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Add auth headers if required for these API calls
      const [
        statsResponse, 
        recentRidesResponse, 
        monthlyRideDataResponse, 
        chapterActivityResponse
      ] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/recent-rides'),
        fetch('/api/admin/dashboard/monthly-rides-volume'),
        fetch('/api/admin/dashboard/chapter-activity'),
      ]);

      if (!statsResponse.ok) throw new Error(`Failed to fetch stats: ${statsResponse.statusText}`);
      if (!recentRidesResponse.ok) throw new Error(`Failed to fetch recent rides: ${recentRidesResponse.statusText}`);
      if (!monthlyRideDataResponse.ok) throw new Error(`Failed to fetch monthly ride data: ${monthlyRideDataResponse.statusText}`);
      if (!chapterActivityResponse.ok) throw new Error(`Failed to fetch chapter activity: ${chapterActivityResponse.statusText}`);
      
      const statsData = await statsResponse.json();
      const recentRidesData = await recentRidesResponse.json();
      const monthlyRideChartData = await monthlyRideDataResponse.json();
      const chapterActivityData = await chapterActivityResponse.json();

      setStats(statsData);
      setRecentRides(recentRidesData);
      setMonthlyRideData(monthlyRideChartData);
      setChapterActivity(chapterActivityData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while fetching dashboard data.';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Error Fetching Dashboard Data',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="Admin Dashboard" description="Loading dashboard data..." />
        <div className="text-center p-10">
          <Activity className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Fetching latest information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageTitle title="Admin Dashboard" description="Overview of Yamaha Blue Streaks activities and management tools." />
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><ShieldAlert /> Error Loading Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <Button onClick={fetchDashboardData} className="mt-4" variant="secondary">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="Admin Dashboard" description="Overview of Yamaha Blue Streaks activities and management tools." />
      
      {/* Key Metrics Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers ?? 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.verifiedUsers ?? 0} verified, {stats?.pendingUserVerifications ?? 0} pending
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
              <Bike className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRides ?? 'N/A'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.upcomingRides ?? 0} upcoming, {stats?.pendingRideApprovals ?? 0} pending approval
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active System Alerts</CardTitle>
              <Bell className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats?.activeSystemAlerts ?? 0}</div>
              <Link href="/admin/alerts" className="text-xs text-muted-foreground hover:text-primary">
                View Alerts
              </Link>
            </CardContent>
          </Card>
           <Card className="shadow-md hover:shadow-lg transition-shadow"> {/* Example additional metric */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Community Growth</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+X% this month</div> {/* Replace X with dynamic data */}
              <p className="text-xs text-muted-foreground">
                User and ride activity trend
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">User Management</CardTitle>
              <Users className="h-6 w-6 text-primary" />
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                Verify new users and manage existing accounts. 
                {stats && stats.pendingUserVerifications > 0 ? (
                    <span className="text-destructive font-semibold"> {stats.pendingUserVerifications} users pending.</span>
                ) : (
                    ' No users pending verification.'
                )}
              </CardDescription>
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
              <CardDescription className="mb-4">
                Approve rides, view statistics, and manage ride details.
                 {stats && stats.pendingRideApprovals > 0 ? (
                    <span className="text-destructive font-semibold"> {stats.pendingRideApprovals} rides pending.</span>
                ) : (
                    ' No rides pending approval.'
                )}
              </CardDescription>
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
              <CardDescription className="mb-4">
                Review system notifications and critical alerts.
                {stats && stats.activeSystemAlerts > 0 ? (
                    <span className="text-destructive font-semibold"> {stats.activeSystemAlerts} active alerts.</span>
                ) : (
                    ' No active alerts.'
                )}
              </CardDescription>
              <Button asChild variant="outline">
                <Link href="/admin/alerts">View Alerts</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Ride Statistics Chart */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Monthly Ride Volume</CardTitle>
            <CardDescription>Total rides organized per month.</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyRideData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRideData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false}/>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend wrapperStyle={{fontSize: "12px"}} />
                  <Bar dataKey="rides" fill="hsl(var(--primary))" name="Rides" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-center py-10">No ride data available for chart.</p>}
          </CardContent>
        </Card>

        {/* Recent Ride Activity */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="h-6 w-6 text-primary" /> Recent Ride Activity</CardTitle>
            <CardDescription>Overview of ongoing and upcoming rides.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRides.length === 0 ? (
              <p className="text-muted-foreground text-center py-10">No recent ride activity.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ride Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell>
                        <Link href={`/rides/${ride.id}`} className="font-medium hover:underline text-primary">{ride.name}</Link>
                        <div className="text-xs text-muted-foreground">Captain: {ride.captain}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ride.status === 'Ongoing' ? 'destructive' : 'default'}
                               className={ride.status === 'Ongoing' ? 'bg-green-500 hover:bg-green-600' : ride.status === 'Upcoming' ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                          {ride.status}
                        </Badge>
                        {ride.startTime && <div className="text-xs text-muted-foreground">{ride.startTime}</div>}
                      </TableCell>
                      <TableCell className="text-right">{ride.participantsCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chapter Activity Monitoring */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersRound className="h-6 w-6 text-primary" /> Chapter Activity Monitoring</CardTitle>
          <CardDescription>Monthly ride counts for chapters. Target: {MIN_MONTHLY_RIDES_THRESHOLD} rides/month.</CardDescription>
        </CardHeader>
        <CardContent>
          {chapterActivity.length === 0 ? (
             <p className="text-muted-foreground text-center py-10">No chapter activity data available.</p>
          ) : (
            <div className="space-y-4">
              {chapterActivity.map(chapter => (
                <div key={chapter.id} className="p-4 border rounded-lg bg-card hover:bg-muted/20">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-semibold">{chapter.name} ({chapter.membersCount} members)</h4>
                    {chapter.isBelowThreshold && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangleIcon size={14} /> Low Activity
                      </Badge>
                    )}
                  </div>
                  <Progress value={(chapter.ridesThisMonth / MIN_MONTHLY_RIDES_THRESHOLD) * 100} className="h-2 mb-1" />
                  <p className="text-xs text-muted-foreground">
                    {chapter.ridesThisMonth} / {MIN_MONTHLY_RIDES_THRESHOLD} rides this month.
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <p className="text-sm text-muted-foreground mt-6 text-center">
        Note: Dashboard data is currently fetched from API endpoints returning mock values. Backend database queries need to be implemented for real-time information.
      </p>
    </div>
  );
}
