import type { Ride } from '@/types';
import { RideCard } from './RideCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface RideListProps {
  rides: Ride[];
}

export function RideList({ rides }: RideListProps) {
  // Basic filtering/sorting placeholders - state management would be needed for actual functionality
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 p-4 border bg-card rounded-lg shadow">
        <Input placeholder="Search rides by name or location..." className="flex-grow" />
        <div className="flex gap-4">
          <Select defaultValue="all">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Flagship">Flagship</SelectItem>
              <SelectItem value="Chapter">Chapter</SelectItem>
              <SelectItem value="Micro">Micro</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="date">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="participants">Participants</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {rides.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No rides found. Check back later or create your own!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} />
          ))}
        </div>
      )}
    </div>
  );
}
