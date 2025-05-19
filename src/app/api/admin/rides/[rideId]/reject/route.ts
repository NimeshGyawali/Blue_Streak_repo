
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  console.warn("SECURITY WARNING: Admin check in /api/admin/rides/[rideId]/reject/route.ts PATCH is a placeholder and always returns true. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  return true; // REMOVE THIS AND IMPLEMENT REAL LOGIC
}

const rejectRideParamsSchema = z.object({
  rideId: z.string().uuid("Invalid Ride ID format."), // Assuming rideId is a UUID
});

// Optional: Define a schema for the request body if you want to include a rejection reason
// const rejectRideBodySchema = z.object({
//   reason: z.string().min(1, "Rejection reason is required.").optional(),
// });

export async function PATCH(
  request: NextRequest,
  { params }: { params: { rideId: string } }
) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const paramsValidation = rejectRideParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ message: 'Invalid input in URL parameters.', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { rideId } = paramsValidation.data;

    // Optional: Parse and validate request body for rejection reason
    // const body = await request.json().catch(() => ({})); // Allow empty body if reason is optional
    // const bodyValidation = rejectRideBodySchema.safeParse(body);
    // if (!bodyValidation.success) {
    //   return NextResponse.json({ message: 'Invalid input in request body.', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    // }
    // const { reason } = bodyValidation.data;

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

      // Update ride status to 'Rejected'
      // You might also want to store the rejection reason if you implement that
      const updateResult = await client.query(
        "UPDATE rides SET status = 'Rejected', updated_at = NOW() WHERE id = $1 RETURNING id, name, status", // Add , rejection_reason = $2 if storing reason
        [rideId] // Add , reason if storing reason
      );

      return NextResponse.json({ message: 'Ride rejected successfully!', ride: updateResult.rows[0] }, { status: 200 });

    } catch (dbError) {
      console.error('Reject Ride DB error:', dbError);
      return NextResponse.json({ message: 'Database error during ride rejection.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Reject Ride API error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
