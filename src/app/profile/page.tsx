
'use client';

import { useEffect, useState } from 'react';
import { UserProfile } from '@/components/profile/UserProfile';
import type { User, Ride } from '@/types';
import { PageTitle } from '@/components/ui/PageTitle';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert, UserCircle, Navigation, Award } from 'lucide-react'; // Added Navigation and Award

// Mock achievements data (will be replaced by API calls later)
const mockAchievements: { id: string; name: string; description: string; icon?: React.ElementType, dateEarned: Date }[] = [
  { id: 'ach01', name: 'First Ride Completed', description: 'You completed your first Yamaha Blue Streaks ride!', dateEarned: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), icon: Award },
  { id: 'ach02', name: 'Road Captain', description: 'Successfully led a Micro-Ride.', dateEarned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), icon: UserCircle },
  { id: 'ach03', name: 'Weekend Warrior', description: 'Completed 3 rides in a single month.', dateEarned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), icon: Navigation },
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
          <div className="flex items-center gap-2 mb-4">
            <Navigation size={22} className="text-primary" />
            <Skeleton className="h-6 w-1/3" /> {/* Title Skeleton */}
          </div>
          <Skeleton className="h-10 w-full mb-2" /> {/* Item Skeleton */}
          <Skeleton className="h-10 w-full mb-2" /> {/* Item Skeleton */}
          <Skeleton className="h-10 w-full" />      {/* Item Skeleton */}
        </div>
        <div className="p-6 border rounded-lg shadow-lg">
           <div className="flex items-center gap-2 mb-4">
            <Award size={22} className="text-primary" />
            <Skeleton className="h-6 w-1/3" /> {/* Title Skeleton */}
          </div>
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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [rideHistory, setRideHistory] = useState<Ride[]>([]);
  const [isLoadingRideHistory, setIsLoadingRideHistory] = useState(true);
  const [rideHistoryError, setRideHistoryError] = useState<string | null>(null);

  const { toast } = useToast();

  useEffect(() => {
    async function fetchProfileAndHistory() {
      if (authLoading) return; // Wait for auth context to load

      if (!token) {
        setProfileError('Not authenticated. Please log in.');
        setRideHistoryError('Not authenticated. Please log in.');
        setIsLoadingProfile(false);
        setIsLoadingRideHistory(false);
        return;
      }

      // Fetch Profile Data
      setIsLoadingProfile(true);
      setProfileError(null);
      try {
        const profileResponse = await fetch('/api/users/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!profileResponse.ok) {
          const errorResult = await profileResponse.json();
          throw new Error(errorResult.message || `Failed to fetch profile (status: ${profileResponse.status})`);
        }
        const data: User = await profileResponse.json();
        setProfileData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching profile.';
        setProfileError(errorMessage);
        toast({ variant: 'destructive', title: 'Error Fetching Profile', description: errorMessage });
      } finally {
        setIsLoadingProfile(false);
      }

      // Fetch Ride History
      setIsLoadingRideHistory(true);
      setRideHistoryError(null);
      try {
        const historyResponse = await fetch('/api/users/me/rides', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!historyResponse.ok) {
          const errorResult = await historyResponse.json();
          throw new Error(errorResult.message || `Failed to fetch ride history (status: ${historyResponse.status})`);
        }
        const historyData: Ride[] = await historyResponse.json();
        setRideHistory(historyData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error fetching ride history.';
        setRideHistoryError(errorMessage);
        toast({ variant: 'destructive', title: 'Error Fetching Ride History', description: errorMessage });
      } finally {
        setIsLoadingRideHistory(false);
      }
    }

    fetchProfileAndHistory();
  }, [token, toast, authLoading]);

  if (authLoading || isLoadingProfile) {
    return (
      <div className="space-y-8">
        <PageTitle title="My Profile" description="Loading your Yamaha Blue Streaks profile..." />
        <ProfileSkeleton />
      </div>
    );
  }

  if (profileError || !profileData) {
    return (
      <div className="space-y-8 text-center">
        <PageTitle title="My Profile" description="View and manage your Yamaha Blue Streaks profile." />
        <div className="p-10 border rounded-lg shadow-md bg-card">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Could not load profile</h2>
            <p className="text-muted-foreground mb-4">{profileError || "An unexpected issue occurred."}</p>
            {!token && (
                <Button onClick={() => window.location.href = '/auth/login'}>Login</Button>
            )}
        </div>
      </div>
    );
  }

  // Note: Ride history loading/error is handled within UserProfile component for now,
  // or you can add specific loading indicators here for the ride history section.
  return (
    <div className="space-y-8">
      <PageTitle title="My Profile" description="View and manage your Yamaha Blue Streaks profile." />
      <UserProfile 
        user={profileData} 
        rideHistory={rideHistory} 
        achievements={mockAchievements} // Achievements still mock
        isLoadingRideHistory={isLoadingRideHistory}
        rideHistoryError={rideHistoryError}
      />
    </div>
  );
}
