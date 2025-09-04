-- BratBox Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Create the main data table
CREATE TABLE IF NOT EXISTS bratbox_data (
    id INTEGER PRIMARY KEY DEFAULT 1,
    epics JSONB DEFAULT '[]'::jsonb,
    stories JSONB DEFAULT '[]'::jsonb,
    sprint_stories JSONB DEFAULT '[]'::jsonb,
    next_epic_number INTEGER DEFAULT 1,
    next_story_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial row
INSERT INTO bratbox_data (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE bratbox_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (public access)
CREATE POLICY "Allow all operations on bratbox_data" ON bratbox_data
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_bratbox_data_updated_at 
    BEFORE UPDATE ON bratbox_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON bratbox_data TO anon;
GRANT ALL ON bratbox_data TO authenticated;

-- Enable real-time for the table
ALTER PUBLICATION supabase_realtime ADD TABLE bratbox_data;