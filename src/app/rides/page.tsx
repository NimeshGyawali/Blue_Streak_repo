import { RideList } from '@/components/rides/RideList';
import type { Ride } from '@/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PageTitle } from '@/components/ui/PageTitle';

// Mock data for rides
const mockRides: Ride[] = [
  {
    id: '1',
    name: 'Sunrise Coastal Cruise',
    description: 'Enjoy a breathtaking sunrise view as we cruise along the coast. Suitable for all skill levels.',
    type: 'Chapter',
    dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    route: { start: 'City Center Marina', end: 'Ocean View Point Lighthouse' },
    captain: { id: 'capt1', name: 'Captain Dave' },
    participants: Array(5).fill(null).map((_, i) => ({ id: `user${i}`, name: `Rider ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'coastline sunrise'
  },
  {
    id: '2',
    name: 'Mountain Twisties Challenge',
    description: 'A challenging ride through scenic mountain roads with plenty of twists and turns. For experienced riders.',
    type: 'Flagship',
    dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    route: { start: 'Mountain Base Camp', end: 'Summit Peak Cafe' },
    captain: { id: 'capt2', name: 'Admin Yamaha' },
    participants: Array(15).fill(null).map((_, i) => ({ id: `userB${i}`, name: `Adventurer ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'mountain motorcycle'
  },
  {
    id: '3',
    name: 'Weekend Coffee Meetup',
    description: 'A casual weekend ride to grab coffee and chat with fellow riders. All welcome!',
    type: 'Micro',
    dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    route: { start: 'The Daily Grind Cafe', end: 'The Daily Grind Cafe' },
    captain: { id: 'userX', name: 'Rider Sarah' },
    participants: Array(3).fill(null).map((_, i) => ({ id: `userC${i}`, name: `Cafe Rider ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'motorcycle coffee'
  },
  {
    id: '4',
    name: 'Historical Route Explorer',
    description: 'Discover local history on this guided tour through old towns and landmarks.',
    type: 'Chapter',
    dateTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    route: { start: 'Old Town Square', end: 'Heritage Museum' },
    captain: { id: 'capt3', name: 'Captain Lee' },
    participants: Array(8).fill(null).map((_, i) => ({ id: `userD${i}`, name: `Explorer ${i+1}` })),
    status: 'Upcoming',
    thumbnailUrl: 'https://placehold.co/600x400.png',
    photoHints: 'historic town'
  }
];

export default function RidesPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <PageTitle title="Discover Rides" description="Find upcoming Yamaha rides and events near you or create your own." />
        <Button asChild>
          <Link href="/rides/create">Create Micro-Ride</Link>
        </Button>
      </div>
      <RideList rides={mockRides} />
    </div>
  );
}
