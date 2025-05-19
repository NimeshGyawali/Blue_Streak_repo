
'use client';

import { useEffect, useState } from 'react';
import { RideDetailsPageContent } from '@/components/rides/RideDetailsPageContent';
import type { Ride, User } from '@/types';
import { notFound, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/ui/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Added Button for Try Again
import { useRouter } from 'next/navigation'; // Added useRouter for Try Again

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
  const rideId = typeof params.id === 'string' ? params.id : undefined;
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  async function fetchRideDetails() {
    if (!rideId) {
      setIsLoading(false);
      setError("Ride ID is missing.");
      notFound(); // Call notFound if rideId is definitively missing
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/rides/${rideId}`);
      if (response.status === 404) {
        notFound(); 
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch ride details.');
      }
      const data: Ride = await response.json();
      setRide(data);
      // Dynamically set metadata (title) - This is client-side
      document.title = `${data.name} | Yamaha Blue Streaks`;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      if (!errorMessage.toLowerCase().includes("not found")) { // Avoid double toasting if notFound was called
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
  }, [rideId]); // Removed toast from dependencies as fetchRideDetails is now standalone

  if (isLoading) {
    return <RideDetailsSkeleton />;
  }

  if (error) {
    // If notFound() was called, this part might not be reached or might show after a brief flash.
    // This handles other types of errors.
    return (
      <div className="text-center py-10">
        <PageTitle title="Error" description={`Could not load ride details: ${error}`} />
        <Button onClick={() => fetchRideDetails()} variant="outline" className="mt-4 mr-2">Try Again</Button>
        <Button onClick={() => router.push('/rides')} variant="outline" className="mt-4">Back to Rides</Button>
      </div>
    );
  }
  
  if (!ride) {
    // This ensures notFound is called if ride is null after loading and no error was set that implies notFound.
    // It's a safeguard.
    notFound();
  }

  return <RideDetailsPageContent ride={ride} />;
}
