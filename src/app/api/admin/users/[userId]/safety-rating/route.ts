
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import { JWT_SECRET } from '@/lib/authConstants';
import jwt from 'jsonwebtoken';
import type { User } from '@/types';

interface DecodedToken {
  userId: string;
  isAdmin: boolean;
  iat: number;
}

interface AdminAuthResult {
  isAdmin: boolean;
  userId?: string;
  error?: string;
  status?: number;
}

// Placeholder - Replace with your actual robust admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<AdminAuthResult> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Authorization header missing or malformed.', status: 401 };
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return { isAdmin: false, error: 'Token not found.', status: 401 };
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    if (!decoded.isAdmin) {
      return { isAdmin: false, error: 'Forbidden: Administrator access required.', status: 403 };
    }
    return { isAdmin: true, userId: decoded.userId };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return { user: null, error: `Invalid token: ${error.message}`, status: 401 };
    }
    console.error('Admin check error:', error);
    return { isAdmin: false, error: 'Internal server error during token validation.', status: 500 };
  }
}

const updateSafetyRatingParamsSchema = z.object({
  userId: z.string().uuid("Invalid target User ID format."),
});

const updateSafetyRatingBodySchema = z.object({
  safetyRating: z.number().min(1, "Safety rating must be at least 1.").max(5, "Safety rating must be at most 5."),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const adminAuth = await checkAdminStatus(request);
  if (!adminAuth.isAdmin) {
    return NextResponse.json({ message: adminAuth.error || 'Forbidden: Administrator access required.' }, { status: adminAuth.status || 403 });
  }

  try {
    const paramsValidation = updateSafetyRatingParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ message: 'Invalid User ID.', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { userId: targetUserId } = paramsValidation.data;

    const body = await request.json();
    const bodyValidation = updateSafetyRatingBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({ message: 'Invalid request body.', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { safetyRating } = bodyValidation.data;

    const client = await pool.connect();
    try {
      const userExistsResult = await client.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
      if (userExistsResult.rows.length === 0) {
        return NextResponse.json({ message: 'Target user not found.' }, { status: 404 });
      }

      const updateResult = await client.query(
        `UPDATE users
         SET safety_rating = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, name, email, city, bike_model, vin, is_verified, is_captain, is_admin, avatar_url, created_at, safety_rating`,
        [safetyRating, targetUserId]
      );

      const updatedUser = {
        ...updateResult.rows[0],
        id: String(updateResult.rows[0].id),
        // Ensure all fields from AdminUser type are present or handled
        safety_rating: updateResult.rows[0].safety_rating,
      };
      
      // Cast to User for a more generic user object
      const returnedUser: Partial<User> = {
        id: String(updatedUser.id),
        name: updatedUser.name,
        email: updatedUser.email,
        city: updatedUser.city,
        bikeModel: updatedUser.bike_model,
        vin: updatedUser.vin,
        is_verified: updatedUser.is_verified,
        isCaptain: updatedUser.is_captain,
        is_admin: updatedUser.is_admin,
        avatarUrl: updatedUser.avatar_url,
        safety_rating: updatedUser.safety_rating,
      };


      return NextResponse.json({ message: 'User safety rating updated successfully!', user: returnedUser }, { status: 200 });

    } catch (dbError) {
      console.error('Update Safety Rating DB error:', dbError);
      return NextResponse.json({ message: 'Database error during safety rating update.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update Safety Rating API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
