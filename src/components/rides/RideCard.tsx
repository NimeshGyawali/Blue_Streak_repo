
import Image from 'next/image';
import Link from 'next/link';
import type { Ride } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Users, MapPin, UserCircle } from 'lucide-react';
import { format } from 'date-fns';

interface RideCardProps {
  ride: Ride;
}

export function RideCard({ ride }: RideCardProps) {
  return (
    <Card className="flex flex-col h-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={ride.thumbnailUrl || `https://placehold.co/600x400.png`}
            alt={ride.name}
            fill={true}
            className="object-cover"
            data-ai-hint={ride.photoHints || "motorcycle event"}
          />
          <Badge variant={ride.type === 'Flagship' ? 'default' : ride.type === 'Chapter' ? 'secondary' : 'outline'} className="absolute top-2 right-2 bg-opacity-80 backdrop-blur-sm">
            {ride.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-2 truncate">{ride.name}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-1 line-clamp-2">
          {ride.description || `A ${ride.type} ride from ${ride.route.start} to ${ride.route.end}.`}
        </CardDescription>
        <div className="space-y-2 mt-3 text-sm text-foreground/80">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            <span>{format(new Date(ride.dateTime), 'MMM dd, yyyy \'at\' h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-primary" />
            <span>From: {ride.route.start}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserCircle size={16} className="text-primary" />
            <span>Captain: {ride.captain.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-primary" />
            <span>{ride.participants.length} participants</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button asChild className="w-full">
          <Link href={`/rides/${ride.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
