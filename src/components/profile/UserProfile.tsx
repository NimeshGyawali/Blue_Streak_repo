'use client';

import type { User, Ride } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Award, Bike, CalendarDays, Edit3, MapPin, ShieldCheck, Star, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: React.ElementType;
  dateEarned: Date;
}

interface UserProfileProps {
  user: User;
  rideHistory: Ride[];
  achievements: Achievement[];
}

export function UserProfile({ user, rideHistory, achievements }: UserProfileProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Card */}
      <Card className="lg:col-span-1 shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/150x150.png`} alt={user.name} data-ai-hint="person portrait" />
            <AvatarFallback className="text-3xl">{user.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
          {user.isCaptain && <Badge variant="default" className="mt-2"><ShieldCheck size={14} className="mr-1" /> Certified Captain</Badge>}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center text-sm">
            <MapPin size={16} className="mr-2 text-primary" />
            <span>{user.city || 'City not set'}</span>
          </div>
          <div className="flex items-center text-sm">
            <Bike size={16} className="mr-2 text-primary" />
            <span>{user.bikeModel || 'Bike model not set'}</span>
          </div>
          <div className="text-sm">
            <span className="font-semibold text-primary">VIN:</span> {user.vin ? `${user.vin.substring(0,4)}...${user.vin.substring(user.vin.length - 4)}` : 'Not set'}
          </div>
          <Button variant="outline" className="w-full mt-4">
            <Edit3 size={16} className="mr-2" /> Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Ride History & Achievements */}
      <div className="lg:col-span-2 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Navigation size={22} className="text-primary"/> Ride History</CardTitle>
            <CardDescription>Your past adventures on Yamaha MotoConnect.</CardDescription>
          </CardHeader>
          <CardContent>
            {rideHistory.length === 0 ? (
              <p className="text-muted-foreground">No rides completed yet. <Link href="/rides" className="text-primary hover:underline">Find a ride!</Link></p>
            ) : (
              <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {rideHistory.map((ride) => (
                  <li key={ride.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/rides/${ride.id}`} className="font-semibold text-primary hover:underline">{ride.name}</Link>
                        <p className="text-xs text-muted-foreground">{ride.type} Ride</p>
                      </div>
                      <Badge variant="outline">{ride.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CalendarDays size={12} /> {format(new Date(ride.dateTime), 'MMM dd, yyyy')}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award size={22} className="text-primary" /> Achievements & Badges</CardTitle>
            <CardDescription>Milestones you've reached in the community.</CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-muted-foreground">No achievements unlocked yet. Keep riding!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach) => (
                  <div key={ach.id} className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                    {ach.icon ? <ach.icon size={36} className="text-accent mt-1" /> : <Star size={36} className="text-accent mt-1" />}
                    <div>
                      <h4 className="font-semibold">{ach.name}</h4>
                      <p className="text-xs text-muted-foreground">{ach.description}</p>
                      <p className="text-xs text-muted-foreground/80 mt-0.5">Earned: {format(new Date(ach.dateEarned), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
