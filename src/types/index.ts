
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
  avatarUrl?: string; // URL to the user's avatar image
}

export interface RidePhoto {
  id: string; // Or number, depending on your DB
  url: string;
  uploader: Pick<User, 'id' | 'name' | 'avatarUrl'>; // Simplified uploader info
  caption?: string;
  dataAiHint?: string;
  uploaded_at?: string; // ISO string date
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
  dateTime: Date; // Should be Date object on client, string from API
  captain: User; 
  participants: User[]; 
  photos?: RidePhoto[]; // Array of photo objects
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled' | 'Pending Approval' | 'Rejected';
  thumbnailUrl?: string; // For RideCard, main display image
  photoHints?: string; // For RideCard placeholder, hints for AI image gen for thumbnail
}

export interface LeaderboardEntry {
  rank: number;
  user: User; // Or group
  ridesConducted: number;
  totalDistance: number; // in km or miles
  totalParticipantsInRides: number;
  score?: number; // A composite score if needed
}

export interface SystemAlert {
  id: string;
  type: string;
  message: string;
  details_url: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Investigating' | 'ActionRequired' | 'Resolved' | 'Dismissed';
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  resolved_by_user_id: string | null;
  resolved_at: string | null; // ISO Date string
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_name: string | null; // e.g., 'Star', 'Bike' to map to Lucide icon names
  criteria_details: string | null;
  date_earned: string; // ISO Date string for when the user earned it
}
