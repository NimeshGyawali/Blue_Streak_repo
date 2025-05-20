
'use client';

import type { Ride, User } from '@/types';
import Image from 'next/image';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhotoUploadForm } from './PhotoUploadForm';
import { CalendarDays, Users, MapPin, UserCircle, MessageCircle, Image as ImageIcon, Route, HelpCircle, UploadCloud, LogIn, UserPlus, UserMinus } from 'lucide-react'; // Removed LogOutIcon
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface RideDetailsPageContentProps {
  ride: Ride;
}

// Mock Chat Message component
const ChatMessage = ({ user, message, time }: { user: User, message: string, time: string }) => (
  <div className="flex items-start gap-2.5 p-3 hover:bg-muted/50 rounded-md">
    <Avatar className="h-8 w-8">
      <AvatarImage src={user.avatarUrl || \`https://placehold.co/40x40.png\`} alt={user.name} data-ai-hint="person avatar"/>
      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
    </Avatar>
    <div className="flex flex-col w-full max-w-[320px] leading-1.5">
      <div className="flex items-center space-x-2 rtl:space-x-reverse">
        <span className="text-sm font-semibold text-foreground">{user.name}</span>
        <span className="text-xs font-normal text-muted-foreground">{time}</span>
      </div>
      <p className="text-sm font-normal py-1 text-foreground/90">{message}</p>
    </div>
  </div>
);

export function RideDetailsPageContent({ ride: initialRide }: RideDetailsPageContentProps) {
  const { user, token, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [ride, setRide] = useState<Ride>(initialRide);
  const [isJoiningOrLeaving, setIsJoiningOrLeaving] = useState(false);
  const [isCurrentUserParticipant, setIsCurrentUserParticipant] = useState(false);

  useEffect(() => {
    setRide(initialRide); 
    if (user && initialRide.participants) {
      setIsCurrentUserParticipant(initialRide.participants.some(p => p.id === user.id));
    } else {
      setIsCurrentUserParticipant(false);
    }
  }, [initialRide, user]);


  const handleJoinOrLeaveRide = async (action: 'join' | 'leave') => {
    if (!user || !token) {
      toast({ variant: 'destructive', title: 'Authentication Required', description: 'Please log in to join or leave rides.' });
      router.push('/auth/login?redirect=/rides/' + ride.id);
      return;
    }
    if (isJoiningOrLeaving) return;

    setIsJoiningOrLeaving(true);
    const endpoint = \`/api/rides/\${ride.id}/\${action}\`; // Uses ride.id which should be correct

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || \`Failed to \${action} ride.\`);
      }

      toast({ title: \`Successfully \${action === 'join' ? 'Joined' : 'Left'} Ride\`, description: result.message });
      
      if (action === 'join') {
        setIsCurrentUserParticipant(true);
        setRide(prevRide => ({
          ...prevRide,
          participants: prevRide.participants.find(p => p.id === user.id) ? prevRide.participants : [...prevRide.participants, user]
        }));
      } else {
        setIsCurrentUserParticipant(false);
        setRide(prevRide => ({
          ...prevRide,
          participants: prevRide.participants.filter(p => p.id !== user.id)
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : \`An unknown error occurred while trying to \${action} the ride.\`;
      toast({ variant: 'destructive', title: \`\${action.charAt(0).toUpperCase() + action.slice(1)} Ride Failed\`, description: errorMessage });
    } finally {
      setIsJoiningOrLeaving(false);
    }
  };


  const mockChatMessages = [
    { user: ride.captain, message: "Hey everyone, excited for the ride!", time: "10:00 AM" },
    { user: ride.participants[0] || {id:'p1', name:'Rider Tom', avatarUrl: \`https://placehold.co/40x40.png\`}, message: "Me too! Weather looks great.", time: "10:05 AM" },
    { user: ride.captain, message: "Remember to bring water and check your tire pressure.", time: "10:10 AM" },
  ];

  const galleryPhotos = ride.photos?.length ? ride.photos : [
    { id: 'ph1', url: ride.thumbnailUrl || 'https://placehold.co/300x200.png', uploader: ride.captain, caption: 'Ride Thumbnail (Placeholder)', dataAiHint: ride.photoHints || 'motorcycle group' },
  ];


  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-xl">
        <div className="relative w-full h-64 md:h-96">
          <Image
            src={ride.thumbnailUrl || \`https://placehold.co/1200x400.png\`}
            alt={ride.name}
            fill={true}
            className="object-cover"
            priority
            data-ai-hint={ride.photoHints || "motorcycle adventure"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6">
            <Badge variant={ride.type === 'Flagship' ? 'default' : ride.type === 'Chapter' ? 'secondary' : 'outline'} className="mb-2 text-sm px-3 py-1">
              {ride.type} Ride
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{ride.name}</h1>
          </div>
        </div>
        <CardContent className="p-6 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Ride Details</h2>
            <p className="text-muted-foreground">{ride.description || 'No additional description provided for this ride.'}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <CalendarDays size={20} className="text-primary" />
                <div>
                  <span className="font-medium">Date & Time:</span><br/>
                  {format(new Date(ride.dateTime), "EEEE, MMM dd, yyyy 'at' h:mm a")}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <MapPin size={20} className="text-primary" />
                <div>
                  <span className="font-medium">Start:</span> {ride.route.start} <br/>
                  <span className="font-medium">End:</span> {ride.route.end}
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <UserCircle size={20} className="text-primary" />
                 <div>
                  <span className="font-medium">Captain:</span> {ride.captain.name}
                </div>
              </div>
               <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                <Users size={20} className="text-primary" />
                <div>
                  <span className="font-medium">Status:</span> <Badge variant={ride.status === 'Upcoming' ? 'default' : 'outline'}>{ride.status}</Badge>
                </div>
              </div>
            </div>
            {ride.route.mapLink && (
              <Button variant="outline" asChild className="mt-4">
                <a href={ride.route.mapLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Route size={18} /> View Route on Map
                </a>
              </Button>
            )}
          </div>
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Ride Actions</h2>
            {!authLoading && user && ride.status === 'Upcoming' && (
              isCurrentUserParticipant ? (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => handleJoinOrLeaveRide('leave')}
                  disabled={isJoiningOrLeaving}
                >
                  <UserMinus className="mr-2 h-4 w-4" /> {isJoiningOrLeaving ? 'Leaving...' : 'Leave Ride'}
                </Button>
              ) : (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleJoinOrLeaveRide('join')}
                  disabled={isJoiningOrLeaving}
                >
                   <UserPlus className="mr-2 h-4 w-4" /> {isJoiningOrLeaving ? 'Joining...' : 'Join Ride'}
                </Button>
              )
            )}
             {!authLoading && !user && ride.status === 'Upcoming' && (
                <Button className="w-full" onClick={() => router.push('/auth/login?redirect=/rides/' + ride.id)}>
                    <LogIn className="mr-2 h-4 w-4" /> Login to Join
                </Button>
            )}
            {ride.status === 'Ongoing' && (
              <Button className="w-full" disabled>Ride In Progress</Button>
            )}
            {ride.status === 'Completed' && (
              <Button className="w-full" variant="secondary" disabled>Ride Completed</Button>
            )}
             {ride.status === 'Cancelled' && (
              <Button className="w-full" variant="destructive" disabled>Ride Cancelled</Button>
            )}
             {ride.status === 'Pending Approval' && (
              <Button className="w-full" variant="outline" disabled>Pending Approval</Button>
            )}
             {ride.status === 'Rejected' && (
              <Button className="w-full" variant="destructive" disabled>Ride Rejected</Button>
            )}
            <Button variant="outline" className="w-full flex items-center gap-2">
              <HelpCircle size={18} /> Contact Captain/HQ
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="participants" className="flex items-center gap-1"><Users size={16}/>Participants ({ride.participants.length + 1})</TabsTrigger> {/* +1 for captain */}
          <TabsTrigger value="chat" className="flex items-center gap-1"><MessageCircle size={16}/>Group Chat</TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-1"><ImageIcon size={16}/>Photo Gallery</TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-1"><UploadCloud size={16}/>Upload Photos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants">
          <Card>
            <CardHeader>
              <CardTitle>Participants ({ride.participants.length + 1})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[ride.captain, ...ride.participants].map((pUser, index) => (
                <div key={pUser.id || \`participant-\${index}\`} className="flex items-center gap-3 p-3 bg-muted/20 hover:bg-muted/50 rounded-md transition-colors">
                  <Avatar>
                    <AvatarImage src={pUser.avatarUrl || \`https://placehold.co/40x40.png\`} alt={pUser.name} data-ai-hint="person avatar" />
                    <AvatarFallback>{pUser.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">{pUser.name} {pUser.id === ride.captain.id && <Badge variant="secondary" className="ml-2">Captain</Badge>}</p>
                    {pUser.bikeModel && <p className="text-xs text-muted-foreground">{pUser.bikeModel}</p>}
                  </div>
                </div>
              ))}
               {ride.participants.length === 0 && (!user || ride.captain.id !== user?.id) && ( // Show if no participants other than possibly the captain
                <p className="text-muted-foreground text-center py-4">Be the first to join this ride!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Group Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-80 overflow-y-auto p-2 border rounded-md space-y-2 bg-muted/20">
                {mockChatMessages.map((msg, idx) => (
                  <ChatMessage key={idx} user={msg.user} message={msg.message} time={msg.time} />
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Type your message..." className="flex-grow" />
                <Button>Send</Button>
              </div>
              <p className="text-xs text-center text-muted-foreground">Chat feature is a visual mock-up. Functionality coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              {galleryPhotos.length === 0 || (galleryPhotos.length === 1 && galleryPhotos[0].caption?.includes('Placeholder')) ? (
                <p className="text-center text-muted-foreground py-4">No photos uploaded yet for this ride. Be the first to share!</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {galleryPhotos.map((photo, index) => (
                    <div key={photo.id || \`gallery-photo-\${index}\`} className="group relative aspect-square overflow-hidden rounded-lg shadow-md">
                      <Image src={photo.url} alt={photo.caption || \`Ride photo \${index + 1}\`} fill={true} className="object-cover" data-ai-hint={photo.dataAiHint || "motorcycle image"} />
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          <p>{photo.caption}</p>
                          <p className="text-white/70">By: {photo.uploader.name}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload">
            <PhotoUploadForm rideId={ride.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
