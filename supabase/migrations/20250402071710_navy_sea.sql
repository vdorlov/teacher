/*
  # Fix appointments table and policies

  1. Table Structure
    - `appointments` table with all necessary fields
    - Foreign key relationship with auth.users
    - Timestamps and status flags
  
  2. Security
    - Enable RLS
    - Add policies for CRUD operations
    - Handle existing policies gracefully
*/

-- Create the appointments table if it doesn't exist
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  student text NOT NULL,
  subject text NOT NULL,
  duration text NOT NULL,
  comment text,
  homework text,
  studied text,
  is_confirmed boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
    DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
END $$;

-- Create policies
CREATE POLICY "Users can view their own appointments"
  ON appointments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own appointments"
  ON appointments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
  ON appointments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
  ON appointments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);