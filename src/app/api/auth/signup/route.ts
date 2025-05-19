
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { pool } from '@/lib/db'; 
import bcrypt from 'bcryptjs';

const signupSchemaServer = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  city: z.string().min(1, "City/Region is required."),
  bikeModel: z.string().min(1, "Yamaha Bike Model is required."),
  vin: z.string().min(17, "VIN must be 17 characters.").max(17, "VIN must be 17 characters."),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchemaServer.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password, city, bikeModel, vin } = validation.data;

    const client = await pool.connect();
    try {
      // Check if user already exists
      const existingUserResult = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existingUserResult.rows.length > 0) {
        return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert the new user into the database
      // Default is_captain and is_verified to false
      const newUserResult = await client.query(
        `INSERT INTO users (name, email, password_hash, city, bike_model, vin, is_captain, is_verified, created_at, updated_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) 
         RETURNING id, name, email, city, bike_model, vin, is_captain, is_verified, avatar_url`,
        [name, email.toLowerCase(), hashedPassword, city, bikeModel, vin, false, false]
      );
      const newUser = newUserResult.rows[0];

      // TODO: Generate a session/token (e.g., JWT) and include it in the response
      // For now, just returning the user
      return NextResponse.json({ 
        message: 'Signup successful!', 
        user: newUser, 
        // token: 'YOUR_GENERATED_JWT_TOKEN' // Placeholder for token
      }, { status: 201 });

    } catch (dbError) {
      console.error('Signup DB error:', dbError);
      return NextResponse.json({ message: 'Database error during signup.' }, { status: 500 });
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Signup API error:', error);
    if (error instanceof z.ZodError) { // Should be caught by initial validation, but good practice
        return NextResponse.json({ message: 'Validation error', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
