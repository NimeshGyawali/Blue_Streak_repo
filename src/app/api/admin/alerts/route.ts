
import { type NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { z } from 'zod';

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<boolean> {
  console.warn("SECURITY WARNING: Admin check in /api/admin/alerts/route.ts GET is a placeholder. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  // 1. Extract token/session from request.
  // 2. Validate token/session.
  // 3. Query database for user associated with token/session and check their is_admin flag.
  return true; // REMOVE THIS AND IMPLEMENT REAL LOGIC
}

export interface SystemAlert {
  id: string;
  type: string;
  message: string;
  details_url: string | null;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'New' | 'Investigating' | 'ActionRequired' | 'Resolved' | 'Dismissed';
  created_at: string;
  updated_at: string;
  resolved_by_user_id: string | null;
  resolved_at: string | null;
}


export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdminStatus(request);
    if (!isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
      const query = `
        SELECT 
          id::text, 
          type, 
          message,
          details_url, 
          severity, 
          status,
          created_at,
          updated_at,
          resolved_by_user_id::text,
          resolved_at
        FROM system_alerts
        WHERE status != 'Dismissed' AND status != 'Resolved' -- Example: Fetch active alerts
        ORDER BY 
            CASE severity
                WHEN 'Critical' THEN 1
                WHEN 'High' THEN 2
                WHEN 'Medium' THEN 3
                WHEN 'Low' THEN 4
                ELSE 5
            END,
            created_at DESC;
      `;
      
      const result = await client.query(query);
      const alerts: SystemAlert[] = result.rows.map(row => ({
        ...row,
        created_at: new Date(row.created_at).toISOString(),
        updated_at: new Date(row.updated_at).toISOString(),
        resolved_at: row.resolved_at ? new Date(row.resolved_at).toISOString() : null,
      }));
      
      return NextResponse.json(alerts, { status: 200 });

    } catch (dbError) {
      console.error('List System Alerts DB error:', dbError);
      return NextResponse.json({ message: 'Database error while fetching system alerts.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('List System Alerts API error:', error);
    if (error instanceof Error && error.message.includes('Forbidden')) {
        return NextResponse.json({ message: error.message }, { status: 403 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}

// TODO: Implement POST for creating alerts (if needed via API), PATCH for updating alert status (e.g., dismiss, resolve)
