-- BratBox Supabase Setup Verification Script
-- Run this in your Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'bratbox_data'
) AS table_exists;

-- 2. Check if initial row exists
SELECT * FROM bratbox_data WHERE id = 1;

-- 3. If no row exists, create it
INSERT INTO bratbox_data (id) 
VALUES (1) 
ON CONFLICT (id) DO NOTHING;

-- 4. Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'bratbox_data';

-- 5. Check policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'bratbox_data';

-- 6. Verify permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'bratbox_data';

-- 7. Check current data structure
SELECT 
    id,
    jsonb_array_length(epics) AS epics_count,
    jsonb_array_length(stories) AS stories_count,
    jsonb_array_length(sprint_stories) AS sprint_stories_count,
    next_epic_number,
    next_story_number,
    updated_at
FROM bratbox_data 
WHERE id = 1;

