
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';

// TODO: Replace this with your actual admin authentication logic
async function checkAdminStatus(request: NextRequest): Promise<{isAdmin: boolean, userId?: string}> {
  console.warn("SECURITY WARNING: Admin check in /api/admin/alerts/[alertId]/status PATCH is a placeholder. IMPLEMENT REAL ADMIN AUTHENTICATION.");
  // 1. Extract token/session from request.
  // 2. Validate token/session.
  // 3. Query database for user associated with token/session and check their is_admin flag.
  // 4. Return { isAdmin: true, userId: 'admin-user-id-from-token' } if admin
  return { isAdmin: true, userId: '00000000-0000-0000-0000-000000000001' }; // REMOVE THIS AND IMPLEMENT REAL LOGIC
}

const updateAlertStatusParamsSchema = z.object({
  alertId: z.string().uuid("Invalid Alert ID format."),
});

const updateAlertStatusBodySchema = z.object({
  status: z.enum(['New', 'Investigating', 'ActionRequired', 'Resolved', 'Dismissed'], {
    required_error: "New status is required.",
    invalid_type_error: "Invalid status value.",
  }),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const adminAuth = await checkAdminStatus(request);
    if (!adminAuth.isAdmin) {
      return NextResponse.json({ message: 'Forbidden: Administrator access required.' }, { status: 403 });
    }

    const paramsValidation = updateAlertStatusParamsSchema.safeParse(params);
    if (!paramsValidation.success) {
      return NextResponse.json({ message: 'Invalid Alert ID.', errors: paramsValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { alertId } = paramsValidation.data;

    const body = await request.json();
    const bodyValidation = updateAlertStatusBodySchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json({ message: 'Invalid request body.', errors: bodyValidation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { status: newStatus } = bodyValidation.data;

    const client = await pool.connect();
    try {
      const alertExistsResult = await client.query('SELECT id, status FROM system_alerts WHERE id = $1', [alertId]);
      if (alertExistsResult.rows.length === 0) {
        return NextResponse.json({ message: 'Alert not found.' }, { status: 404 });
      }
      
      const currentAlert = alertExistsResult.rows[0];
      if (currentAlert.status === newStatus) {
        return NextResponse.json({ message: `Alert is already in '${newStatus}' status.` }, { status: 400 });
      }

      let queryText = 'UPDATE system_alerts SET status = $1, updated_at = NOW()';
      const queryParams: (string | Date | null)[] = [newStatus];

      if (newStatus === 'Resolved') {
        queryText += ', resolved_at = NOW(), resolved_by_user_id = $2';
        queryParams.push(adminAuth.userId || null); // Use authenticated admin's ID
      } else if (currentAlert.status === 'Resolved' && (newStatus === 'New' || newStatus === 'Investigating' || newStatus === 'ActionRequired')) {
        // If moving from Resolved to another state, clear resolved fields
        queryText += ', resolved_at = NULL, resolved_by_user_id = NULL';
      }
      
      queryText += ' WHERE id = $' + (queryParams.length + 1) + ' RETURNING *;';
      queryParams.push(alertId);
      
      const updateResult = await client.query(queryText, queryParams);
      
      const updatedAlert = {
        ...updateResult.rows[0],
        id: String(updateResult.rows[0].id),
        resolved_by_user_id: updateResult.rows[0].resolved_by_user_id ? String(updateResult.rows[0].resolved_by_user_id) : null,
        created_at: new Date(updateResult.rows[0].created_at).toISOString(),
        updated_at: new Date(updateResult.rows[0].updated_at).toISOString(),
        resolved_at: updateResult.rows[0].resolved_at ? new Date(updateResult.rows[0].resolved_at).toISOString() : null,
      };

      return NextResponse.json({ message: `Alert status updated to ${newStatus}.`, alert: updatedAlert }, { status: 200 });

    } catch (dbError) {
      console.error('Update Alert Status DB error:', dbError);
      return NextResponse.json({ message: 'Database error during alert status update.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update Alert Status API error:', error);
    if (error instanceof z.ZodError) { 
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
