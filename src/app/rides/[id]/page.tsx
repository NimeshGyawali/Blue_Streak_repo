import { RideDetailsPageContent } from '@/components/rides/RideDetailsPageContent';
import type { Ride } from '@/types';
import { notFound } from 'next/navigation';

// Mock data fetching function
async function getRideDetails(id: string): Promise<Ride | null> {
  // Simulate API call
  const mockRides: Ride[] = [
    {
      id: '1',
      name: 'Sunrise Coastal Cruise',
      description: 'Enjoy a breathtaking sunrise view as we cruise along the coast. Suitable for all skill levels. We will meet at the Marina Cafe and ride towards the Lighthouse Point, stopping for photos along the way. Expected duration is 3 hours.',
      type: 'Chapter',
      dateTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      route: { start: 'City Center Marina', end: 'Ocean View Point Lighthouse', mapLink: 'https://maps.google.com' },
      captain: { id: 'capt1', name: 'Captain Dave', avatarUrl: 'https://placehold.co/100x100.png?text=CD' },
      participants: [
        { id: 'user1', name: 'Rider Alice', avatarUrl: 'https://placehold.co/100x100.png?text=RA' },
        { id: 'user2', name: 'Rider Bob', avatarUrl: 'https://placehold.co/100x100.png?text=RB'},
      ],
      status: 'Upcoming',
      thumbnailUrl: 'https://placehold.co/1200x400.png',
      photoHints: 'coastal road',
      photos: [
        { url: 'https://placehold.co/600x400.png', uploader: { id: 'capt1', name: 'Captain Dave' }, caption: 'Pre-ride briefing', dataAiHint: 'group meeting' },
        { url: 'https://placehold.co/600x400.png', uploader: { id: 'user1', name: 'Rider Alice' }, caption: 'Beautiful coastal view!', dataAiHint: 'ocean scenic' },
      ]
    },
    // Add more mock rides if needed for testing other IDs
    {
      id: '2',
      name: 'Mountain Twisties Challenge',
      description: 'A challenging ride through scenic mountain roads with plenty of twists and turns. For experienced riders. Total climb of 2000m. Bring your A-game!',
      type: 'Flagship',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      route: { start: 'Mountain Base Camp', end: 'Summit Peak Cafe', mapLink: 'https://maps.google.com' },
      captain: { id: 'capt2', name: 'Admin Yamaha', avatarUrl: 'https://placehold.co/100x100.png?text=AY' },
      participants: Array(15).fill(null).map((_, i) => ({ id: `userB${i}`, name: `Adventurer ${i+1}`, avatarUrl: `https://placehold.co/100x100.png?text=A${i+1}` })),
      status: 'Upcoming',
      thumbnailUrl: 'https://placehold.co/1200x400.png',
      photoHints: 'mountain pass'
    },
  ];
  return mockRides.find(r => r.id === id) || null;
}


export default async function RideDetailPage({ params }: { params: { id: string } }) {
  const ride = await getRideDetails(params.id);

  if (!ride) {
    notFound();
  }

  return <RideDetailsPageContent ride={ride} />;
}

// Optional: Generate static paths if you have a known set of rides
// export async function generateStaticParams() {
//   // Fetch all ride IDs
//   // const rides = await fetch('.../rides').then((res) => res.json())
//   // return rides.map((ride) => ({ id: ride.id }))
//   return [{ id: '1' }, { id: '2' }]; // Example
// }

export async function generateMetadata({ params }: { params: { id: string } }) {
  const ride = await getRideDetails(params.id);
  if (!ride) {
    return { title: 'Ride Not Found' }
  }
  return {
    title: `${ride.name} | Yamaha MotoConnect`,
    description: ride.description || `Details for the ${ride.type} ride: ${ride.name}.`,
  }
}
