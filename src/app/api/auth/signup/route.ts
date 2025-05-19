
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
// TODO: Import your PostgreSQL client (e.g., 'pg') and database connection setup
// import { pool } from '@/lib/db'; // Example path to your DB setup
// TODO: Import a password hashing library (e.g., 'bcryptjs')
// import bcrypt from 'bcryptjs';

const signupSchemaServer = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  city: z.string().min(1),
  bikeModel: z.string().min(1),
  vin: z.string().min(17).max(17),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = signupSchemaServer.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: 'Invalid input.', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, password, city, bikeModel, vin } = validation.data;

    // --- TODO: PostgreSQL Logic ---
    // 1. Connect to your PostgreSQL database
    // const client = await pool.connect();
    // try {
    //   // 2. Check if user already exists
    //   const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    //   if (existingUser.rows.length > 0) {
    //     return NextResponse.json({ message: 'User with this email already exists.' }, { status: 409 });
    //   }
    //
    //   // 3. Hash the password
    //   // const hashedPassword = await bcrypt.hash(password, 10); // Adjust salt rounds as needed
    //
    //   // 4. Insert the new user into the database
    //   // const newUserResult = await client.query(
    //   //   'INSERT INTO users (name, email, password_hash, city, bike_model, vin, is_captain) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, city, bike_model, vin, is_captain, avatar_url',
    //   //   [name, email, hashedPassword, city, bikeModel, vin, false] // Default is_captain to false
    //   // );
    //   // const newUser = newUserResult.rows[0];
    //
    //   // 5. Generate a session/token (e.g., JWT) and return user data
    //   // return NextResponse.json({ message: 'Signup successful!', user: newUser, token: 'YOUR_GENERATED_JWT_TOKEN' }, { status: 201 });
    //
    // } finally {
    //   client.release();
    // }
    // --- End PostgreSQL Logic ---

    // Placeholder response until DB logic is implemented
    console.log('Signup attempt:', { name, email, password, city, bikeModel, vin });
    // Simulate successful signup for now
    return NextResponse.json({ message: 'Signup successful! (Mock Response)', user: { id: 'mockId', name, email } }, { status: 201 });

  } catch (error) {
    console.error('Signup API error:', error);
    return NextResponse.json({ message: 'An unexpected error occurred.' }, { status: 500 });
  }
}
