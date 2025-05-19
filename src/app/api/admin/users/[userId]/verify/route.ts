
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db'; 
// TODO: Import any authentication/authorization utility you have to check if the requester is an admin

const verifyUserParamsSchema = z.object({
  userId: z.string().uuid("Invalid User ID format."), // Assuming user IDs are UUIDs
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // --- TODO: Admin Authentication/Authorization ---
    // 1. Get the current authenticated user (e.g., from session or token from request headers/cookies)
    // 2. Check if this user has admin privileges. If not, return 403 Forbidden.
    // const isAdmin = await checkAdminStatus(request); // Your utility function
    // if (!isAdmin) {
    //   return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
    // }
    // For now, we'll proceed assuming admin status for development. REMOVE THIS IN PRODUCTION.
    console.warn("Admin check bypassed in /api/admin/users/[userId]/verify/route.ts. Implement proper admin authentication.");
    // --- End Admin Authentication/Authorization ---

    const validation = verifyUserParamsSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId } = validation.data;

    const client = await pool.connect();
    try {
      // Check if the user exists
      const userExistsResult = await client.query('SELECT id, is_verified FROM users WHERE id = $1', [userId]);
      if (userExistsResult.rows.length === 0) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }

      const user = userExistsResult.rows[0];
      if (user.is_verified) {
        return NextResponse.json({ message: 'User is already verified.' }, { status: 400 });
      }
      
      // Update the user's verification status
      await client.query('UPDATE users SET is_verified = $1, updated_at = NOW() WHERE id = $2', [true, userId]);
      
      const updatedUserResult = await client.query('SELECT id, name, email, is_verified FROM users WHERE id = $1', [userId]);
      const updatedUser = updatedUserResult.rows[0];

      return NextResponse.json({ message: 'User verified successfully!', user: updatedUser }, { status: 200 });

    } catch (dbError) {
      console.error('Verify User DB error:', dbError);
      return NextResponse.json({ message: 'Database error during user verification.' }, { status: 500 });
    }
    finally {
      client.release();
    }

  } catch (error) {
    console.error('Verify User API error:', error);
    if (error instanceof z.ZodError) { // Should be caught by initial validation
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
