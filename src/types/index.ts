
export interface User {
  id: string;
  name: string;
  email?: string;
  city?: string;
  bikeModel?: string;
  vin?: string;
  isCaptain?: boolean;
  is_admin?: boolean; 
  is_verified?: boolean; 
  avatarUrl?: string;
  // rideHistory: Ride[]; // Simplified for now
  // achievements: string[]; // Simplified for now
}

export interface Ride {
  id: string;
  name: string;
  type: 'Flagship' | 'Chapter' | 'Micro';
  description?: string;
  route: {
    start: string;
    end: string;
    mapLink?: string; // Optional: link to Google Maps, etc.
  };
  dateTime: Date;
  captain: User; // Should be captain_id (string) in DB, and fetched/joined for display
  participants: User[]; // Should be a join table in DB
  photos?: { url: string, uploader: User, caption?: string, dataAiHint?: string }[];
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Pending Approval' | 'Rejected';
  thumbnailUrl?: string; // For RideCard
  photoHints?: string; // For RideCard placeholder
}

export interface LeaderboardEntry {
  rank: number;
  user: User; // Or group
  ridesConducted: number;
  totalDistance: number; // in km or miles
  totalParticipantsInRides: number;
  score?: number; // A composite score if needed
}
