
# BratBox Shared Storage Setup Guide

## Current Implementation: Supabase (Active)

BratBox is currently configured to use **Supabase** for shared storage and real-time collaboration. This provides:

- ✅ Real-time synchronization across all team members
- ✅ PostgreSQL database for reliable data storage
- ✅ Automatic fallback to localStorage if Supabase is unavailable
- ✅ No additional setup required - already configured!

### How It Works
1. **Primary Storage**: Supabase database stores all epics, stories, and sprint data
2. **Real-time Sync**: Changes are automatically synced every 3 seconds across all users
3. **Fallback**: If Supabase is unavailable, the app falls back to localStorage
4. **Team Collaboration**: Multiple team members can work simultaneously

## Configuration Files

The following files handle the Supabase integration:
- `supabase-config.js` - Supabase client configuration
- `supabase-schema.sql` - Database schema setup
- `SUPABASE_SETUP.md` - Detailed Supabase setup instructions

## Testing Shared Storage
1. Open the app in two different browsers or devices
2. Create an epic or user story in one browser
3. Wait a few seconds or refresh the other browser
4. You should see the new item appear automatically
5. This confirms shared storage and real-time sync are working

## Troubleshooting

If you're not seeing real-time updates:
1. Check your internet connection
2. Verify Supabase is accessible (check browser console for errors)
3. The app will automatically fall back to localStorage if needed
4. All data will sync once Supabase connectivity is restored

