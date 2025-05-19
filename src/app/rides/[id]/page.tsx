
'use client';

import { useEffect, useState } from 'react';
import { RideDetailsPageContent } from '@/components/rides/RideDetailsPageContent';
import type { Ride } from '@/types';
import { notFound, useParams } from 'next/navigation'; // Import useParams
import { useToast } from '@/hooks/use-toast';
import { PageTitle } from '@/components/ui/PageTitle';
import { Skeleton } from '@/components/ui/skeleton';

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
  const params = useParams(); // Get params using hook
  const rideId = typeof params.id === 'string' ? params.id : undefined;
  const [ride, setRide] = useState<Ride | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!rideId) {
      // This case should ideally be handled by routing or a notFound() call earlier
      // if the ID is not present or invalid before reaching this page.
      // For now, if ID is somehow undefined, treat as not found.
      setIsLoading(false);
      setError("Ride ID is missing.");
      return;
    }

    async function fetchRideDetails() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/rides/${rideId}`);
        if (response.status === 404) {
          // Call notFound directly if API confirms resource doesn't exist
          notFound(); 
          return;
        }
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch ride details.');
        }
        const data: Ride = await response.json();
        setRide(data);
        // Dynamically set metadata (title) - This is client-side, for server-side use generateMetadata
        document.title = `${data.name} | Yamaha Blue Streaks`;

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        // Only toast if it's not a "not found" error already handled by redirect
        if (errorMessage !== "Ride not found.") {
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
    fetchRideDetails();
  }, [rideId, toast]);

  if (isLoading) {
    return <RideDetailsSkeleton />;
  }

  if (error) {
    // If notFound() was called, this part won't be reached.
    // This handles other types of errors.
    return (
      <div className="text-center py-10">
        <PageTitle title="Error" description={`Could not load ride details: ${error}`} />
        <Button onClick={() => router.push('/rides')} variant="outline" className="mt-4">Back to Rides</Button>
      </div>
    );
  }
  
  // If ride is null and no error, it implies notFound() should have been called or ID was invalid.
  // The notFound() call within fetchRideDetails should handle this.
  // However, as a fallback, if ride is still null here for some reason:
  if (!ride) {
      notFound(); // Ensure notFound is called if ride is null post-loading
  }


  return <RideDetailsPageContent ride={ride} />;
}

// Note: generateMetadata should be kept if you want server-side metadata generation.
// For client-side rendering as above, dynamic title update is handled in useEffect.
// If this page is purely client-rendered, generateMetadata might not be as effective
// without further adjustments for client-side data fetching that can feed into it.
// For a truly dynamic server-rendered page, data fetching for metadata should happen in generateMetadata.

// Example: Keep generateMetadata if you still pre-render some aspects or for SEO.
// You would need a server-side version of getRideDetails for this to work optimally.
// async function getRideDetailsServer(id: string): Promise<Ride | null> { ... }
// export async function generateMetadata({ params }: { params: { id: string } }) {
//   const ride = await getRideDetailsServer(params.id); // Use a server-side fetch
//   if (!ride) {
//     return { title: 'Ride Not Found' }
//   }
//   return {
//     title: `${ride.name} | Yamaha Blue Streaks`,
//     description: ride.description || `Details for the ${ride.type} ride: ${ride.name}.`,
//   }
// }
