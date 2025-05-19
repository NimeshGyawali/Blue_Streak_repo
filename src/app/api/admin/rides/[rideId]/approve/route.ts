
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  console.warn("SECURITY WARNING: Admin check in /api/admin/rides/[rideId]/approve/route.ts PATCH is a placeholder and always returns true. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  return true; // REMOVE THIS AND IMPLEMENT REAL LOGIC
}

const approveRideParamsSchema = z.object({
  rideId: z.string().uuid("Invalid Ride ID format."), // Assuming rideId is a UUID
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rideId: string } }
) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const validation = approveRideParamsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { rideId } = validation.data;

    const client = await pool.connect();
    try {
      // Check if ride exists and is pending approval
      const rideResult = await client.query(
        'SELECT id, status FROM rides WHERE id = $1',
        [rideId]
      );

      if (rideResult.rows.length === 0) {
        return NextResponse.json({ message: 'Ride not found.' }, { status: 404 });
      }

      const ride = rideResult.rows[0];
      if (ride.status !== 'Pending Approval') {
        return NextResponse.json({ message: `Ride is not pending approval. Current status: ${ride.status}` }, { status: 400 });
      }

      // Update ride status to 'Upcoming' (or 'Approved', depending on your desired workflow)
      const updateResult = await client.query(
        `UPDATE rides 
         SET status = 'Upcoming', updated_at = NOW() 
         WHERE id = $1 
         RETURNING id, name, type, description, route_start, route_end, route_map_link, date_time, captain_id, status, thumbnail_url, photo_hints`,
        [rideId]
      );

      const approvedRide = {
        ...updateResult.rows[0],
        id: String(updateResult.rows[0].id),
        captain_id: String(updateResult.rows[0].captain_id) // Ensure captain_id is string if type expects
      };


      return NextResponse.json({ message: 'Ride approved successfully!', ride: approvedRide }, { status: 200 });

    } catch (dbError) {
      console.error('Approve Ride DB error:', dbError);
      return NextResponse.json({ message: 'Database error during ride approval.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Approve Ride API error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
