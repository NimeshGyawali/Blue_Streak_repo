
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import type { Ride } from '@/types'; // Assuming Ride type is relevant for response

// TODO: Implement proper user authentication check
// This function should extract the user ID from a valid session/token
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
  dateTime: z.string().datetime({ message: "Invalid date and time format." }), // Expecting ISO string from client
  description: z.string().max(500, "Description must be 500 characters or less.").optional(),
  // Optional: Add mapLink if you plan to include it in the form
  // mapLink: z.string().url("Invalid URL for map link.").optional(),
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
      // For Micro-Rides, type is 'Micro' and status is 'Upcoming' (auto-approved)
      const rideType = 'Micro';
      const rideStatus = 'Upcoming';

      const result = await client.query<Ride>(
        `INSERT INTO rides (name, type, description, route_start, route_end, date_time, captain_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         RETURNING id, name, type, description, route_start, route_end, date_time AS "dateTime", captain_id AS "captainId", status`,
        [name, rideType, description || '', startPoint, endPoint, new Date(dateTime), captainId, rideStatus]
      );

      const newRide = result.rows[0];

      return NextResponse.json({ message: 'Micro-Ride created successfully!', ride: newRide }, { status: 201 });

    } catch (dbError) {
      console.error('Create Ride DB error:', dbError);
      return NextResponse.json({ message: 'Database error during ride creation.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create Ride API error:', error);
    if (error instanceof z.ZodError) { // Should be caught by initial validation
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
