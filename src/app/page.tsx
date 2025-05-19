
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RideCard } from '@/components/rides/RideCard';
import type { Ride } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function HomePage() {
  const [featuredRides, setFeaturedRides] = useState<Ride[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFeaturedRides() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/rides'); // Using the same endpoint
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch featured rides.');
        }
        const allRides: Ride[] = await response.json();
        // Select first 3 rides as "featured" or implement more specific logic
        setFeaturedRides(allRides.slice(0, 3)); 
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        toast({
          variant: 'destructive',
          title: 'Error Fetching Featured Rides',
          description: errorMessage,
        });
        setFeaturedRides([]); // Clear rides on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchFeaturedRides();
  }, [toast]);

  return (
    <div className="space-y-12">
      <section className="relative text-center py-16 md:py-24 rounded-lg overflow-hidden shadow-xl bg-gradient-to-r from-primary to-blue-700">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="https://placehold.co/1200x400.png"
            alt="Motorcycle riding background" 
            fill={true}
            className="object-cover"
            priority
            data-ai-hint="motorcycle scenic"
          />
        </div>
        <div className="relative container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            Welcome to Yamaha Blue Streaks
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Discover exciting rides, connect with fellow Yamaha enthusiasts, and share your passion for the open road with Yamaha Blue Streaks.
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/rides">Explore Rides</Link>
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold mb-6 text-center text-foreground">Featured Rides</h2>
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(n => <CardSkeleton key={n} />)}
          </div>
        )}
        {!isLoading && featuredRides.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} />
            ))}
          </div>
        )}
        {!isLoading && featuredRides.length === 0 && (
           <p className="text-center text-muted-foreground py-6">No featured rides available at the moment. Check back soon!</p>
        )}
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/rides">View All Rides</Link>
          </Button>
        </div>
      </section>

      <section className="py-12 bg-card rounded-lg shadow-lg">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-semibold mb-6 text-foreground">Join the Community</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
                Become a part of the official Yamaha riders community. Create or join rides, participate in events, and climb the leaderboard.
            </p>
            <div className="flex justify-center gap-4">
                <Button asChild>
                    <Link href="/auth/signup">Sign Up Now</Link>
                </Button>
                <Button variant="secondary" asChild>
                    <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
            </div>
        </div>
      </section>
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
