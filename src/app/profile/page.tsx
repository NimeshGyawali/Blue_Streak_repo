
'use client';

import { useEffect, useState } from 'react';
import { UserProfile } from '@/components/profile/UserProfile';
import type { User, Ride } from '@/types'; // Keep Ride type for mock data
import { PageTitle } from '@/components/ui/PageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, UserCircle } from 'lucide-react';

// Mock ride history and achievements data (will be replaced by API calls later)
const mockRideHistory: Ride[] = [
  {
    id: 'ride001',
    name: 'City Lights Night Ride',
    type: 'Micro',
    dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    route: { start: 'Downtown Plaza', end: 'Skyline Viewpoint' },
    captain: { id: 'user123', name: 'Alex Rider' },
    participants: [{ id: 'user123', name: 'Alex Rider' }, {id: 'friend1', name: 'Casey Jones'}],
    status: 'Completed',
  },
  {
    id: 'ride002',
    name: 'Coastal Highway Cruise',
    type: 'Chapter',
    dateTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
    route: { start: 'Beachfront Cafe', end: 'Sunset Cliffs' },
    captain: { id: 'captDave', name: 'Captain Dave' },
    participants: Array(6).fill(null).map((_,i)=>({id: `p${i}`, name:`Rider ${i}`})),
    status: 'Completed',
  },
];

const mockAchievements: { id: string; name: string; description: string; icon?: React.ElementType, dateEarned: Date }[] = [
  { id: 'ach01', name: 'First Ride Completed', description: 'You completed your first Yamaha Blue Streaks ride!', dateEarned: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
  { id: 'ach02', name: 'Road Captain', description: 'Successfully led a Micro-Ride.', dateEarned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: 'ach03', name: 'Weekend Warrior', description: 'Completed 3 rides in a single month.', dateEarned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
];

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card Skeleton */}
      <div className="lg:col-span-1 p-6 border rounded-lg shadow-lg space-y-4">
        <Skeleton className="w-24 h-24 rounded-full mx-auto" />
        <Skeleton className="h-6 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-1/3 mx-auto mb-2" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full mt-2" />
      </div>
      {/* Ride History & Achievements Skeletons */}
      <div className="lg:col-span-2 space-y-8">
        <div className="p-6 border rounded-lg shadow-lg">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <Skeleton className="h-16 w-full mb-2" />
          <Skeleton className="h-16 w-full" />
        </div>
        <div className="p-6 border rounded-lg shadow-lg">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}


export default function ProfilePage() {
  const { user: authUser, token, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfileData() {
      if (authLoading) return; // Wait for auth context to load

      if (!token) {
        setError('Not authenticated. Please log in.');
        setIsLoading(false);
        // Optionally redirect to login: router.push('/auth/login');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorResult = await response.json();
          throw new Error(errorResult.message || `Failed to fetch profile data (status: ${response.status})`);
        }

        const data: User = await response.json();
        setProfileData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Profile',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [token, toast, authLoading]);

  if (authLoading || isLoading) {
    return (
      <div className="space-y-8">
        <PageTitle title="My Profile" description="Loading your Yamaha Blue Streaks profile..." />
        <ProfileSkeleton />
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="space-y-8 text-center">
        <PageTitle title="My Profile" description="View and manage your Yamaha Blue Streaks profile." />
        <div className="p-10 border rounded-lg shadow-md bg-card">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Could not load profile</h2>
            <p className="text-muted-foreground mb-4">{error || "An unexpected issue occurred."}</p>
            {!token && (
                <Button onClick={() => window.location.href = '/auth/login'}>Login</Button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageTitle title="My Profile" description="View and manage your Yamaha Blue Streaks profile." />
      <UserProfile user={profileData} rideHistory={mockRideHistory} achievements={mockAchievements} />
    </div>
  );
}
