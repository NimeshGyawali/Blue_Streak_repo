
import type { LeaderboardEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, TrendingUp, Bike, Users } from 'lucide-react';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  title?: string;
}

export function LeaderboardTable({ entries, title = "Top Riders" }: LeaderboardTableProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-lg">
      {title && <h3 className="text-lg font-semibold p-4 border-b">{title}</h3>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px] text-center">Rank</TableHead>
            <TableHead>Rider</TableHead>
            <TableHead className="text-center">Rides</TableHead>
            <TableHead className="text-center">Distance (km)</TableHead>
            <TableHead className="text-center hidden sm:table-cell">Total Participants</TableHead>
            <TableHead className="text-right hidden md:table-cell">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                No leaderboard data available yet. Start riding to appear here!
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry) => {
              const avatarHint = entry.user.bikeModel === 'Chapter Group' ? 'group logo' : 'person avatar';
              return (
                <TableRow key={entry.user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-center">
                    <div className="flex items-center justify-center">
                      {entry.rank === 1 && <Award size={20} className="text-yellow-500 mr-1" />}
                      {entry.rank === 2 && <Award size={20} className="text-gray-400 mr-1" />}
                      {entry.rank === 3 && <Award size={20} className="text-yellow-700 mr-1" />}
                      {entry.rank}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={entry.user.avatarUrl || `https://placehold.co/40x40.png`} alt={entry.user.name} data-ai-hint={avatarHint} />
                        <AvatarFallback>{entry.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{entry.user.name}</p>
                        <p className="text-xs text-muted-foreground hidden sm:block">{entry.user.bikeModel || 'Yamaha Rider'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Bike size={16} className="text-muted-foreground"/> {entry.ridesConducted}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{entry.totalDistance.toLocaleString()}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      <Users size={16} className="text-muted-foreground"/> {entry.totalParticipantsInRides.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell className="text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1">
                       {entry.score?.toLocaleString() || 'N/A'} <TrendingUp size={16} className="text-green-500"/>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
