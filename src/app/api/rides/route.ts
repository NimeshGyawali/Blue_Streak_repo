
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import type { Ride, User } from '@/types';

// TODO: Implement proper user authentication check
// This function should extract the user ID from a valid session/token for POST
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  console.warn("SECURITY WARNING: getAuthenticatedUserId in /api/rides POST route is a placeholder. IMPLEMENT REAL AUTHENTICATION.");
  // Placeholder: In a real app, you would get this from a session or JWT
  // For now, returning a dummy user ID. Replace this.
  // const user = await getCurrentUserFromSession(request); // Your actual session logic
  // return user ? user.id : null;
  return '00000000-0000-0000-0000-000000000000'; // Replace with real user ID retrieval
}

const createRideSchema = z.object({
  name: z.string().min(5, "Ride name must be at least 5 characters.").max(100),
  startPoint: z.string().min(3, "Start point is required."),
  endPoint: z.string().min(3, "End point is required."),
  dateTime: z.string().datetime({ message: "Invalid date and time format." }),
  description: z.string().max(500, "Description must be 500 characters or less.").optional(),
});

export async function POST(request: NextRequest) {
  try {
    const captainId = await getAuthenticatedUserId(request);
    if (!captainId) {
      return NextResponse.json({ message: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createRideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, startPoint, endPoint, dateTime, description } = validation.data;

    const client = await pool.connect();
    try {
      const rideType = 'Micro';
      const rideStatus = 'Upcoming'; // Micro-Rides are auto-approved

      const result = await client.query(
        `INSERT INTO rides (name, type, description, route_start, route_end, date_time, captain_id, status, created_at, updated_at, thumbnail_url, photo_hints)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), $9, $10)
         RETURNING id, name, type, description, route_start, route_end, date_time, captain_id, status, thumbnail_url, photo_hints`,
        [name, rideType, description || '', startPoint, endPoint, new Date(dateTime), captainId, rideStatus, `https://placehold.co/600x400.png`, 'motorcycle ride']
      );

      const newRide = result.rows[0];
      const responseRide: Ride = {
        id: String(newRide.id),
        name: newRide.name,
        type: newRide.type as Ride['type'],
        description: newRide.description,
        route: {
          start: newRide.route_start,
          end: newRide.route_end,
        },
        dateTime: new Date(newRide.date_time),
        captain: { id: String(newRide.captain_id), name: 'Fetching Captain...' }, // Captain details would need another query or be passed
        participants: [],
        status: newRide.status as Ride['status'],
        thumbnailUrl: newRide.thumbnail_url,
        photoHints: newRide.photo_hints,
      };

      return NextResponse.json({ message: 'Micro-Ride created successfully!', ride: responseRide }, { status: 201 });

    } catch (dbError) {
      console.error('Create Ride DB error:', dbError);
      return NextResponse.json({ message: 'Database error during ride creation.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create Ride API error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    try {
      // Fetch rides that are 'Upcoming' or 'Approved'
      // Join with users table to get captain's name and avatar
      // Count participants using a subquery or a separate query if performance is an issue for many rides
      const query = `
        SELECT 
          r.id, 
          r.name, 
          r.type, 
          r.description,
          r.route_start, 
          r.route_end, 
          r.route_map_link,
          r.date_time,
          r.status,
          r.thumbnail_url,
          r.photo_hints,
          json_build_object(
            'id', u.id::text,
            'name', u.name, 
            'avatarUrl', u.avatar_url
          ) as captain,
          (SELECT COUNT(*) FROM ride_participants rp WHERE rp.ride_id = r.id) as participants_count
        FROM rides r
        JOIN users u ON r.captain_id = u.id
        WHERE r.status = 'Upcoming' OR r.status = 'Approved' -- Adjust status as needed
        ORDER BY r.date_time ASC;
      `;
      
      const result = await client.query(query);
      
      const rides: Ride[] = result.rows.map(row => ({
        id: String(row.id),
        name: row.name,
        type: row.type as Ride['type'],
        description: row.description,
        route: { 
          start: row.route_start, 
          end: row.route_end, 
          mapLink: row.route_map_link 
        },
        dateTime: new Date(row.date_time),
        captain: row.captain as User,
        // For the list view, we might only need participant count.
        // The full participant list can be fetched on the ride detail page.
        participants: Array(parseInt(row.participants_count, 10)).fill(null).map((_, i) => ({ id: `dummy${i}`, name: `Participant ${i+1}`})),
        status: row.status as Ride['status'],
        thumbnailUrl: row.thumbnail_url,
        photoHints: row.photo_hints,
      }));
      
      return NextResponse.json(rides, { status: 200 });

    } catch (dbError) {
      console.error('List Rides DB error:', dbError);
      return NextResponse.json({ message: 'Database error while fetching rides.' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('List Rides API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
