export interface User {
  id: string;
  name: string;
  email?: string;
  city?: string;
  bikeModel?: string;
  vin?: string;
  isCaptain?: boolean;
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
  captain: User;
  participants: User[];
  photos?: { url: string, uploader: User, caption?: string, dataAiHint?: string }[];
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
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
