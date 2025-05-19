
'use client';

import type { User, Ride, Achievement } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Award, Bike, CalendarDays, Edit3, MapPin, ShieldCheck, Star, Navigation, Hourglass, ShieldAlert, Trophy, UserCheck, TrendingUp, ImageUp, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Skeleton } from '../ui/skeleton';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const iconMap: { [key: string]: React.ElementType } = {
  Bike: Bike,
  UserCheck: UserCheck,
  CalendarDays: CalendarDays,
  TrendingUp: TrendingUp,
  ImageUp: ImageUp,
  Trophy: Trophy,
  Star: Star, 
};

const profileEditSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).max(100),
  city: z.string().min(1, { message: "City is required." }).max(100),
  bikeModel: z.string().min(1, { message: "Bike model is required." }).max(100),
});
type ProfileEditFormData = z.infer<typeof profileEditSchema>;

interface UserProfileProps {
  user: User;
  rideHistory: Ride[];
  achievements: Achievement[];
  isLoadingRideHistory?: boolean;
  rideHistoryError?: string | null;
  isLoadingAchievements?: boolean;
  achievementsError?: string | null;
}

export function UserProfile({ 
  user: initialUser, 
  rideHistory, 
  achievements,
  isLoadingRideHistory,
  rideHistoryError,
  isLoadingAchievements,
  achievementsError
}: UserProfileProps) {
  const { toast } = useToast();
  const { token, updateUser: updateAuthContextUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>(initialUser); // Local state for optimistic updates

  const form = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      name: currentUser.name || '',
      city: currentUser.city || '',
      bikeModel: currentUser.bikeModel || '',
    },
  });
  
  // Sync form default values if initialUser prop changes (e.g. after re-fetch)
  React.useEffect(() => {
    setCurrentUser(initialUser);
    form.reset({
      name: initialUser.name || '',
      city: initialUser.city || '',
      bikeModel: initialUser.bikeModel || '',
    });
  }, [initialUser, form]);


  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to current user data if canceling edit
      form.reset({
        name: currentUser.name || '',
        city: currentUser.city || '',
        bikeModel: currentUser.bikeModel || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const onSubmitEdit = async (data: ProfileEditFormData) => {
    if (!token) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You are not logged in.' });
      return;
    }

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update profile.');
      }
      
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      setCurrentUser(result); // Update local state with response from API
      updateAuthContextUser(result); // Update global auth context
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Update Failed', description: errorMessage });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-1 shadow-lg">
        <CardHeader className="items-center text-center">
          <Avatar className="w-24 h-24 mb-4 border-2 border-primary">
            <AvatarImage src={currentUser.avatarUrl || `https://placehold.co/150x150.png`} alt={currentUser.name} data-ai-hint="person portrait" />
            <AvatarFallback className="text-3xl">{currentUser.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
          </Avatar>
          {!isEditing && (
            <>
              <CardTitle className="text-2xl">{currentUser.name}</CardTitle>
              <CardDescription>{currentUser.email}</CardDescription>
              {currentUser.isCaptain && <Badge variant="default" className="mt-2"><ShieldCheck size={14} className="mr-1" /> Certified Captain</Badge>}
              {currentUser.is_admin && <Badge variant="destructive" className="mt-2"><ShieldCheck size={14} className="mr-1" /> Administrator</Badge>}
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Region</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bikeModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yamaha Bike Model</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="flex gap-2 mt-4">
                  <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                    <Save size={16} className="mr-2" /> Save
                  </Button>
                  <Button type="button" variant="outline" onClick={handleEditToggle} className="flex-1">
                     <X size={16} className="mr-2" /> Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <>
              <div className="flex items-center text-sm">
                <MapPin size={16} className="mr-2 text-primary" />
                <span>{currentUser.city || 'City not set'}</span>
              </div>
              <div className="flex items-center text-sm">
                <Bike size={16} className="mr-2 text-primary" />
                <span>{currentUser.bikeModel || 'Bike model not set'}</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-primary">VIN:</span> {currentUser.vin ? `${currentUser.vin.substring(0,4)}...${currentUser.vin.substring(currentUser.vin.length - 4)}` : 'Not set'}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={handleEditToggle}>
                <Edit3 size={16} className="mr-2" /> Edit Profile
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="lg:col-span-2 space-y-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Navigation size={22} className="text-primary"/> Ride History</CardTitle>
            <CardDescription>Your past adventures on Yamaha Blue Streaks.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRideHistory && (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            )}
            {!isLoadingRideHistory && rideHistoryError && (
              <div className="text-center p-4 border border-destructive bg-destructive/10 rounded-md">
                <ShieldAlert className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-medium text-destructive">Could not load ride history</p>
                <p className="text-xs text-muted-foreground">{rideHistoryError}</p>
              </div>
            )}
            {!isLoadingRideHistory && !rideHistoryError && rideHistory.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No rides completed or joined yet. <Link href="/rides" className="text-primary hover:underline">Find a ride!</Link></p>
            )}
            {!isLoadingRideHistory && !rideHistoryError && rideHistory.length > 0 && (
              <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {rideHistory.map((ride) => (
                  <li key={ride.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/rides/${ride.id}`} className="font-semibold text-primary hover:underline">{ride.name}</Link>
                        <p className="text-xs text-muted-foreground">{ride.type} Ride</p>
                      </div>
                      <Badge variant={ride.status === "Completed" ? "default" : "outline"} 
                             className={ride.status === "Completed" ? "bg-green-500 hover:bg-green-600" : ""}>
                        {ride.status}
                      </Badge>
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
            {isLoadingAchievements && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-24 w-full rounded-lg" />
              </div>
            )}
            {!isLoadingAchievements && achievementsError && (
               <div className="text-center p-4 border border-destructive bg-destructive/10 rounded-md">
                <ShieldAlert className="mx-auto h-8 w-8 text-destructive mb-2" />
                <p className="text-sm font-medium text-destructive">Could not load achievements</p>
                <p className="text-xs text-muted-foreground">{achievementsError}</p>
              </div>
            )}
            {!isLoadingAchievements && !achievementsError && achievements.length === 0 && (
              <p className="text-muted-foreground text-center py-4">No achievements unlocked yet. Keep riding!</p>
            )}
            {!isLoadingAchievements && !achievementsError && achievements.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {achievements.map((ach) => {
                  const IconComponent = ach.icon_name ? iconMap[ach.icon_name] || Star : Star;
                  return (
                    <div key={ach.id} className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
                      <IconComponent size={36} className="text-accent mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold">{ach.name}</h4>
                        <p className="text-xs text-muted-foreground">{ach.description}</p>
                        <p className="text-xs text-muted-foreground/80 mt-0.5">Earned: {format(new Date(ach.date_earned), 'MMM dd, yyyy')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
