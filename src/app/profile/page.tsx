import { UserProfile } from '@/components/profile/UserProfile';
import type { User, Ride } from '@/types';
import { PageTitle } from '@/components/ui/PageTitle';

// Mock user data
const mockUser: User = {
  id: 'user123',
  name: 'Alex Rider',
  email: 'alex.rider@example.com',
  city: 'New York',
  bikeModel: 'Yamaha MT-09 SP',
  vin: 'YR1MXXXXXXXXXXXXXXXX',
  isCaptain: true,
  avatarUrl: 'https://placehold.co/150x150.png',
};

// Mock ride history data
const mockRideHistory: Ride[] = [
  {
    id: 'ride001',
    name: 'City Lights Night Ride',
    type: 'Micro',
    dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    route: { start: 'Downtown Plaza', end: 'Skyline Viewpoint' },
    captain: { id: 'user123', name: 'Alex Rider' }, // Self-captained
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

// Mock achievements
const mockAchievements: { id: string; name: string; description: string; icon?: React.ElementType, dateEarned: Date }[] = [
  { id: 'ach01', name: 'First Ride Completed', description: 'You completed your first Yamaha Blue Streaks ride!', dateEarned: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
  { id: 'ach02', name: 'Road Captain', description: 'Successfully led a Micro-Ride.', dateEarned: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: 'ach03', name: 'Weekend Warrior', description: 'Completed 3 rides in a single month.', dateEarned: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
];

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <PageTitle title="My Profile" description="View and manage your Yamaha Blue Streaks profile." />
      <UserProfile user={mockUser} rideHistory={mockRideHistory} achievements={mockAchievements} />
    </div>
  );
}
