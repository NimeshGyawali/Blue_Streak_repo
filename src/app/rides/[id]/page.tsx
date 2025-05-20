
'use client';

import { useEffect, useState } from 'react';
import { RideDetailsPageContent } from '@/components/rides/RideDetailsPageContent';
import type { Ride } from '@/types';
import { notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/ui/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

// Component to display loading skeleton for RideDetailsPageContent
function RideDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <div className="overflow-hidden shadow-xl rounded-lg">
        <Skeleton className="w-full h-64 md:h-96" />
        <div className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-16 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
            <Skeleton className="h-10 w-40 mt-4" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full max-w-md mx-auto" /> {/* Tabs List Skeleton */}
      <div className="p-6 border rounded-lg"> {/* Tabs Content Skeleton */}
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export default function RideDetailPage() {
  const params = useParams();
  const rideIdFromParams = typeof params.id === 'string' ? params.id : undefined;
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function fetchRideDetails() {
    if (!rideIdFromParams) {
      setIsLoading(false);
      setError("Ride ID is missing from parameters.");
      notFound(); // Call notFound for invalid/missing ID
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rides/${rideIdFromParams}`);
      if (response.status === 404) {
        notFound(); // Call notFound if API returns 404
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ride details.');
      }
      const data: Ride = await response.json();
      setRide(data);
      if (typeof window !== 'undefined') {
        document.title = `${data.name} | Yamaha Blue Streaks`;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      if (!errorMessage.toLowerCase().includes("not found")) {
        toast({
          variant: 'destructive',
          title: 'Error Fetching Ride Details',
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchRideDetails();
  }, [rideIdFromParams]); // Depend on rideIdFromParams

  if (isLoading) {
    return <RideDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <PageTitle title="Error" description={`Could not load ride details: ${error}`} />
        <Button onClick={() => fetchRideDetails()} variant="outline" className="mt-4 mr-2">Try Again</Button>
        <Button onClick={() => router.push('/rides')} variant="outline" className="mt-4">Back to Rides</Button>
      </div>
    );
  }

  if (!ride) {
    // This case should ideally be handled by notFound() earlier if rideId was invalid or API 404'd
    // But as a fallback:
    notFound();
    return null;
  }

  return <RideDetailsPageContent ride={ride} />;
}
