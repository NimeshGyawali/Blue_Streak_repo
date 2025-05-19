import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import type { LeaderboardEntry, User } from '@/types';
import { PageTitle } from '@/components/ui/PageTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


// Mock leaderboard data
const mockUsers: User[] = [
  { id: 'user1', name: 'Evelyn "Velocity" Reed', bikeModel: 'YZF-R1M', avatarUrl: 'https://placehold.co/100x100.png?text=ER' },
  { id: 'user2', name: 'Marcus "Maverick" Chen', bikeModel: 'MT-10 SP', avatarUrl: 'https://placehold.co/100x100.png?text=MC' },
  { id: 'user3', name: 'Sofia "Serpent" Ramirez', bikeModel: 'XSR900', avatarUrl: 'https://placehold.co/100x100.png?text=SR' },
  { id: 'user4', name: 'Kenji "Katana" Tanaka', bikeModel: 'Tracer 9 GT+', avatarUrl: 'https://placehold.co/100x100.png?text=KT' },
  { id: 'user5', name: 'Aisha "Apex" Khan', bikeModel: 'YZF-R7', avatarUrl: 'https://placehold.co/100x100.png?text=AK' },
];

const individualLeaderboard: LeaderboardEntry[] = mockUsers.map((user, index) => ({
  rank: index + 1,
  user: user,
  ridesConducted: Math.floor(Math.random() * 20) + 5, // 5-24 rides
  totalDistance: Math.floor(Math.random() * 5000) + 1000, // 1000-5999 km
  totalParticipantsInRides: Math.floor(Math.random() * 100) + 20, // 20-119 participants
  score: Math.floor(Math.random() * 10000) + 5000, // 5000-14999 score
})).sort((a,b) => (b.score || 0) - (a.score || 0)).map((entry, index) => ({...entry, rank: index + 1}));


// Mock group data (simplified)
const mockGroups = [
    { id: 'groupA', name: 'Coastal Cruisers', avatarUrl: 'https://placehold.co/100x100.png?text=CC' },
    { id: 'groupB', name: 'Mountain Mavericks', avatarUrl: 'https://placehold.co/100x100.png?text=MM' },
    { id: 'groupC', name: 'City Slickers', avatarUrl: 'https://placehold.co/100x100.png?text=CS' },
];

const groupLeaderboard: LeaderboardEntry[] = mockGroups.map((group, index) => ({
  rank: index + 1,
  // Using User type for group for simplicity, adapt if Group type is different
  user: { id: group.id, name: group.name, avatarUrl: group.avatarUrl, bikeModel: 'Chapter Group' }, 
  ridesConducted: Math.floor(Math.random() * 15) + 3,
  totalDistance: Math.floor(Math.random() * 10000) + 2000,
  totalParticipantsInRides: Math.floor(Math.random() * 200) + 50,
  score: Math.floor(Math.random() * 15000) + 7000,
})).sort((a,b) => (b.score || 0) - (a.score || 0)).map((entry, index) => ({...entry, rank: index + 1}));


export default function LeaderboardPage() {
  return (
    <div className="space-y-8">
      <PageTitle title="Leaderboard" description="See who's leading the pack in rides, distance, and participation." />
      
      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="individual">Individual Riders</TabsTrigger>
          <TabsTrigger value="groups">Chapters/Groups</TabsTrigger>
        </TabsList>
        <TabsContent value="individual">
          <LeaderboardTable entries={individualLeaderboard} title="Top Individual Riders" />
        </TabsContent>
        <TabsContent value="groups">
          <LeaderboardTable entries={groupLeaderboard} title="Top Chapters / Groups" />
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        <p><strong>How is the score calculated?</strong> Scores are based on a combination of rides conducted, total distance covered, number of participants in organized rides, and other engagement factors. Keep riding and participating to climb the ranks!</p>
      </div>
    </div>
  );
}
