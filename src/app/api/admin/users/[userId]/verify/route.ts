
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db'; 

// TODO: Replace this with your actual admin authentication logic
// This function should:
// 1. Extract user identity from the request (e.g., from a JWT in Authorization header or a session cookie).
// 2. Query the database to confirm the user exists and has admin privileges (e.g., an 'is_admin' flag is true).
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  // Placeholder: In a real app, you would validate a token/session
  // and check the user's roles in the database.
  console.warn("SECURITY WARNING: Admin check in /api/admin/users/[userId]/verify/route.ts PATCH is a placeholder and always returns true. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  return true; // Placeholder: REMOVE THIS AND IMPLEMENT REAL LOGIC
}


const verifyUserParamsSchema = z.object({
  userId: z.string().uuid("Invalid User ID format."), 
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const validation = verifyUserParamsSchema.safeParse(params);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { userId } = validation.data;

    const client = await pool.connect();
    try {
      const userExistsResult = await client.query('SELECT id, is_verified FROM users WHERE id = $1', [userId]);
      if (userExistsResult.rows.length === 0) {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }

      const user = userExistsResult.rows[0];
      if (user.is_verified) {
        return NextResponse.json({ message: 'User is already verified.' }, { status: 400 });
      }
      
      const updateResult = await client.query(
        `UPDATE users 
         SET is_verified = $1, updated_at = NOW() 
         WHERE id = $2
         RETURNING id, name, email, city, bike_model, vin, is_verified, is_captain, is_admin, avatar_url, created_at`, 
        [true, userId]
      );
      
      const updatedUser = {
        ...updateResult.rows[0],
        id: String(updateResult.rows[0].id)
      };

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
    if (error instanceof z.ZodError) { 
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
