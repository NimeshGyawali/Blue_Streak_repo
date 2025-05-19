
import { type NextRequest, NextResponse } from 'next/server';
// import { pool } from '@/lib/db'; // For when you connect to the DB

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  console.warn("SECURITY WARNING: Admin check in /api/admin/dashboard/recent-rides GET is a placeholder. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  return true; // REMOVE THIS AND IMPLEMENT REAL LOGIC
}

interface RecentRideActivity {
  id: string;
  name: string;
  status: 'Ongoing' | 'Upcoming' | 'Recently Completed';
  participantsCount: number;
  startTime?: string;
  captain: string;
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    // TODO: Replace with actual database queries
    const mockRecentRides: RecentRideActivity[] = [
      { id: 'ride101', name: 'Morning Mist Ride', status: 'Ongoing', participantsCount: 18, startTime: '08:00 Today', captain: 'Admin User' },
      { id: 'ride102', name: 'Weekend Hill Climb', status: 'Upcoming', participantsCount: 22, startTime: '10:00 Saturday', captain: 'Jane Doe' },
      { id: 'ride103', name: 'Historical Route Tour', status: 'Recently Completed', participantsCount: 12, captain: 'John Smith' },
    ];

    return NextResponse.json(mockRecentRides, { status: 200 });

  } catch (error) {
    console.error('Get Recent Rides API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred fetching recent rides.' }, { status: 500 });
  }
}
