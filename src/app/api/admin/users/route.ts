
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
// TODO: Import any authentication/authorization utility to check if the requester is an admin

export async function GET(request: NextRequest) {
  try {
    // --- TODO: Admin Authentication/Authorization ---
    // 1. Get the current authenticated user (e.g., from session or token)
    // 2. Check if this user has admin privileges. If not, return 403 Forbidden.
    // const isAdmin = await checkAdminStatus(request); // Your utility function
    // if (!isAdmin) {
    //   return NextResponse.json({ message: 'Forbidden: Admin access required.' }, { status: 403 });
    // }
    console.warn("Admin check bypassed in /api/admin/users/route.ts GET. Implement proper admin authentication.");
    // --- End Admin Authentication/Authorization ---

    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT id, name, email, city, bike_model, vin, is_verified, is_captain, created_at FROM users ORDER BY created_at DESC'
      );
      
      // Ensure IDs are strings if they are UUIDs or other non-numeric types in the DB that come out as numbers
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
