
'use client';

import { useEffect, useState } from 'react';
import { RideList } from '@/components/rides/RideList';
import type { Ride } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageTitle } from '@/components/ui/PageTitle';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state

export default function RidesPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchRides() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/rides');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch rides.');
        }
        const data = await response.json();
        setRides(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        toast({
          variant: 'destructive',
          title: 'Error Fetching Rides',
          description: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchRides();
  }, [toast]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <PageTitle title="Discover Rides" description="Find upcoming Yamaha rides and events near you or create your own." />
        <Button asChild>
          <Link href="/rides/create">Create Micro-Ride</Link>
        </Button>
      </div>
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <CardSkeleton key={n} />
          ))}
        </div>
      )}
      {!isLoading && error && (
        <div className="text-center py-10 text-destructive">
          <p>Could not load rides: {error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">Try Again</Button>
        </div>
      )}
      {!isLoading && !error && (
        <RideList rides={rides} />
      )}
    </div>
  );
}

// Skeleton component for RideCard
function CardSkeleton() {
  return (
    <div className="flex flex-col space-y-3 p-4 border rounded-lg shadow-lg">
      <Skeleton className="h-48 w-full rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-1/2 mt-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <Skeleton className="h-10 w-full mt-2" />
    </div>
  );
}
