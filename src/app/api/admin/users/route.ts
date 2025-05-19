
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// TODO: Replace this with your actual admin authentication logic
// This function should:
// 1. Extract user identity from the request (e.g., from a JWT in Authorization header or a session cookie).
// 2. Query the database to confirm the user exists and has admin privileges (e.g., an 'is_admin' flag is true).
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  // Placeholder: In a real app, you would validate a token/session
  // and check the user's roles in the database.
  // const token = request.headers.get('Authorization')?.split(' ')[1];
  // if (!token) return false;
  // try {
  //   const decoded = verifyToken(token); // Your JWT verification function
  //   const client = await pool.connect();
  //   try {
  //     const userResult = await client.query('SELECT is_admin FROM users WHERE id = $1', [decoded.userId]);
  //     if (userResult.rows.length > 0 && userResult.rows[0].is_admin) {
  //       return true;
  //     }
  //     return false;
  //   } finally {
  //     client.release();
  //   }
  // } catch (error) {
  //   console.error("Admin check error:", error);
  //   return false;
  // }
  console.warn("SECURITY WARNING: Admin check in /api/admin/users/route.ts GET is a placeholder and always returns true. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  return true; // Placeholder: REMOVE THIS AND IMPLEMENT REAL LOGIC
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, name, email, city, bike_model, vin, is_verified, is_captain, created_at FROM users ORDER BY created_at DESC'
      );
      
      const users = result.rows.map(user => ({
        ...user,
        id: String(user.id) 
      }));

      return NextResponse.json(users, { status: 200 });

    } catch (dbError) {
      console.error('List Users DB error:', dbError);
      return NextResponse.json({ message: 'Database error while fetching users.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('List Users API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
