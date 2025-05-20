
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db';
import type { Ride, User } from '@/types';

const paramsSchema = z.object({
  id: z.string().uuid("Invalid Ride ID format."),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // Ensure this expects params.id
) {
  try {
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid Ride ID.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }
    const { id: rideId } = validation.data; // Use rideId internally after validating params.id

    const client = await pool.connect();
    try {
      const rideQuery = `
        SELECT 
          r.id, 
          r.name, 
          r.type, 
          r.description,
          r.route_start, 
          r.route_end, 
          r.route_map_link,
          r.date_time,
          r.status,
          r.thumbnail_url,
          r.photo_hints,
          json_build_object(
            'id', c.id::text,
            'name', c.name, 
            'avatarUrl', c.avatar_url,
            'bikeModel', c.bike_model 
          ) as captain
        FROM rides r
        JOIN users c ON r.captain_id = c.id
        WHERE r.id = $1;
      `;
      const rideResult = await client.query(rideQuery, [rideId]);

      if (rideResult.rows.length === 0) {
        return NextResponse.json({ message: 'Ride not found.' }, { status: 404 });
      }
      const rideData = rideResult.rows[0];

      const participantsQuery = `
        SELECT 
          u.id::text, 
          u.name, 
          u.avatar_url,
          u.bike_model
        FROM users u
        JOIN ride_participants rp ON u.id = rp.user_id
        WHERE rp.ride_id = $1;
      `;
      const participantsResult = await client.query(participantsQuery, [rideId]);
      const participants: User[] = participantsResult.rows.map(p => ({
        id: p.id,
        name: p.name,
        avatarUrl: p.avatar_url,
        bikeModel: p.bike_model,
      }));
      
      const photosQuery = `
        SELECT 
          rp.id::text, 
          rp.photo_url as url, 
          rp.caption,
          json_build_object(
            'id', u.id::text,
            'name', u.name
          ) as uploader,
          rp.data_ai_hint
        FROM ride_photos rp
        JOIN users u ON rp.uploader_user_id = u.id
        WHERE rp.ride_id = $1
        ORDER BY rp.uploaded_at DESC;
      `;
      const photosResult = await client.query(photosQuery, [rideId]).catch(() => ({ rows: [] }));
      const photos = photosResult.rows.map(p => ({
        url: p.url,
        uploader: p.uploader as User,
        caption: p.caption,
        dataAiHint: p.data_ai_hint,
      }));

      const ride: Ride = {
        id: String(rideData.id),
        name: rideData.name,
        type: rideData.type as Ride['type'],
        description: rideData.description,
        route: { 
          start: rideData.route_start, 
          end: rideData.route_end, 
          mapLink: rideData.route_map_link 
        },
        dateTime: new Date(rideData.date_time),
        captain: rideData.captain as User,
        participants: participants,
        status: rideData.status as Ride['status'],
        thumbnailUrl: rideData.thumbnail_url,
        photoHints: rideData.photo_hints,
        photos: photos,
      };
      
      return NextResponse.json(ride, { status: 200 });

    } catch (dbError) {
      console.error(`Error fetching ride ${rideId}:`, dbError);
      return NextResponse.json({ message: 'Database error while fetching ride details.' }, { status: 500 });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get Ride Detail API error:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
