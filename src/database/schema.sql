-- Enable pgcrypto extension for gen_random_uuid() if not already enabled.
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to update 'updated_at' column automatically
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  city VARCHAR(255),
  bike_model VARCHAR(255),
  vin VARCHAR(17),
  is_captain BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  avatar_url TEXT, -- URL to the user's avatar image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add is_admin column to users if it doesn't exist (for older schemas)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
-- Add avatar_url column to users if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;


-- Trigger for users table
DROP TRIGGER IF EXISTS set_timestamp ON users; -- Drop if exists to avoid conflict
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Rides Table
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Flagship', 'Chapter', 'Micro')),
  description TEXT,
  route_start VARCHAR(255) NOT NULL,
  route_end VARCHAR(255) NOT NULL,
  route_map_link TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  captain_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Captain of the ride
  status VARCHAR(50) NOT NULL CHECK (status IN ('Upcoming', 'Ongoing', 'Completed', 'Cancelled', 'Pending Approval', 'Rejected')),
  thumbnail_url TEXT, -- URL for the ride's main display image
  photo_hints TEXT, -- Hints for AI image generation for thumbnail
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  rejection_reason TEXT -- Optional: reason if a ride is rejected by admin
);

-- Trigger for rides table
DROP TRIGGER IF EXISTS set_timestamp ON rides;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON rides
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Ride Participants Table (Many-to-Many relationship between Users and Rides)
CREATE TABLE IF NOT EXISTS ride_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (ride_id, user_id) -- Ensures a user can join a ride only once
);

-- Ride Photos Table
CREATE TABLE IF NOT EXISTS ride_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES rides(id) ON DELETE CASCADE,
  uploader_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  photo_url TEXT NOT NULL, -- URL of the stored photo
  caption TEXT,
  data_ai_hint TEXT, -- Hints for AI image search/generation
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL, -- e.g., 'NewUserVerification', 'RideReport', 'LowActivityChapter'
  message TEXT NOT NULL,
  details_url TEXT, -- Optional link to more details (e.g., a specific ride or user page)
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('New', 'Investigating', 'ActionRequired', 'Resolved', 'Dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Admin who resolved it
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Trigger for system_alerts table
DROP TRIGGER IF EXISTS set_timestamp ON system_alerts;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON system_alerts
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Achievements Table (Definitions of all possible achievements)
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon_name VARCHAR(100), -- e.g., 'Star', 'Bike', 'Trophy' to map to Lucide icons or custom SVGs
  criteria_details TEXT, -- Human-readable explanation of how it's earned
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Achievements Table (Links users to achievements they've earned)
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  date_earned TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, achievement_id) -- A user can earn a specific achievement only once
);


-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_rides_date_time ON rides(date_time);
CREATE INDEX IF NOT EXISTS idx_ride_participants_ride_id ON ride_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_participants_user_id ON ride_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_ride_photos_ride_id ON ride_photos(ride_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);

-- Seed some example achievements (optional, for testing)
INSERT INTO achievements (name, description, icon_name, criteria_details) VALUES
  ('First Ride Completed', 'You completed your first Yamaha Blue Streaks ride!', 'Bike', 'Participate in and complete one ride.')
  ON CONFLICT (name) DO NOTHING;
INSERT INTO achievements (name, description, icon_name, criteria_details) VALUES
  ('Road Captain', 'Successfully led a Micro-Ride as a captain.', 'UserCheck', 'Create and complete a Micro-Ride as its captain.')
  ON CONFLICT (name) DO NOTHING;
INSERT INTO achievements (name, description, icon_name, criteria_details) VALUES
  ('Weekend Warrior', 'Completed 3 rides in a single calendar month.', 'CalendarDays', 'Be a participant or captain in 3 rides within one month.')
  ON CONFLICT (name) DO NOTHING;
INSERT INTO achievements (name, description, icon_name, criteria_details) VALUES
  ('Century Rider', 'Covered over 100km in a single ride.', 'TrendingUp', 'Participate in a ride where total distance is > 100km.')
  ON CONFLICT (name) DO NOTHING;
INSERT INTO achievements (name, description, icon_name, criteria_details) VALUES
  ('Community Contributor', 'Uploaded 5 photos to ride galleries.', 'ImageUp', 'Upload at least 5 photos across different ride galleries.')
  ON CONFLICT (name) DO NOTHING;
