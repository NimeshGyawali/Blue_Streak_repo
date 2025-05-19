
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { RideCard } from '@/components/rides/RideCard';
import type { Ride } from '@/types'; // Assuming types are defined in @/types

// Mock data for featured rides
const featuredRides: Ride[] = [
  {
    id: '1',
    name: 'Sunrise Coastal Cruise',
    type: 'Chapter',
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    route: { start: 'City Center', end: 'Ocean View Point' },
    captain: { id: 'capt1', name: 'Captain Dave' },
    participants: Array(5).fill(null).map((_, i) => ({ id: `user${i}`, name: `Rider ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'motorcycle landscape'
  },
  {
    id: '2',
    name: 'Mountain Twisties Challenge',
    type: 'Flagship',
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    route: { start: 'Mountain Base', end: 'Summit Peak' },
    captain: { id: 'capt2', name: 'Admin Yamaha' },
    participants: Array(15).fill(null).map((_, i) => ({ id: `userB${i}`, name: `Adventurer ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'mountain road'
  },
  {
    id: '3',
    name: 'Weekend Coffee Meetup',
    type: 'Micro',
    dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    route: { start: 'Local Cafe', end: 'Local Cafe' },
    captain: { id: 'userX', name: 'Rider Sarah' },
    participants: Array(3).fill(null).map((_, i) => ({ id: `userC${i}`, name: `Cafe Rider ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'cafe motorcycle'
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="relative text-center py-16 md:py-24 rounded-lg overflow-hidden shadow-xl bg-gradient-to-r from-primary to-blue-700">
        <div className="absolute inset-0 opacity-20">
          <Image 
            src="https://placehold.co/1200x400.png" // Replace with actual hero image
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredRides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
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
