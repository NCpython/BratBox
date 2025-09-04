# BratBox Supabase Setup Guide

## Step 1: Create Supabase Project (Free 500MB Database)

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" or "Sign up"
3. Sign up with GitHub, Google, or email
4. Click "New Project"
5. Choose your organization (or create a personal one)
6. Enter project details:
   - **Name**: `bratbox`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your team
7. Click "Create new project"
8. Wait for the project to be created (2-3 minutes)

## Step 2: Get API Credentials

1. In your Supabase dashboard, click "Settings" (gear icon)
2. Click "API" in the left sidebar
3. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

## Step 3: Update Configuration

1. Open `supabase-config.js` in your project
2. Replace the placeholder values:

```javascript
const SUPABASE_CONFIG = {
    url: 'YOUR_SUPABASE_URL', // Replace with your Project URL
    anonKey: 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key
};
```

## Step 4: Set Up Database

1. In your Supabase dashboard, go to "SQL Editor"
2. Click "New query"
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the SQL
5. You should see "Success. No rows returned" message

## Step 5: Real-time Updates (Optional)

**Note**: Real-time replication is not available in all regions (including Germany). Don't worry - the app uses polling-based sync which works perfectly everywhere!

If you're in a region that supports real-time:
1. In your Supabase dashboard, go to "Database"
2. Click "Replication" in the left sidebar
3. Find the `bratbox_data` table
4. Toggle the "Replication" switch to ON

**If real-time is not available in your region**: The app will automatically use polling-based sync (every 3 seconds) which provides the same collaborative experience!

## Step 6: Deploy Updated App

1. Save all your changes
2. Deploy to Vercel:
   ```bash
   npx vercel --prod --yes
   ```
3. Your app will now use Supabase for shared storage!

## Testing Real-time Collaboration

1. Open the app in two different browsers
2. Create an epic in one browser
3. You should see it appear in the other browser instantly (no refresh needed)
4. Try editing, deleting, or moving items - all changes sync in real-time

## Supabase Free Tier Limits

- ✅ **500MB Database** - Plenty for BratBox data
- ✅ **2GB Bandwidth** - More than enough for team collaboration
- ✅ **50,000 monthly active users** - Perfect for small teams
- ✅ **Real-time subscriptions** - Instant updates
- ✅ **No credit card required** - Completely free

## Troubleshooting

### If you see "Supabase not initialized" errors:
- Check that your API credentials are correct
- Make sure the Supabase CDN script is loading
- Check browser console for any errors

### If real-time updates aren't working:
- Verify that Replication is enabled for the `bratbox_data` table
- Check that your Supabase project is active
- Try refreshing the page

### If you see authentication errors:
- Make sure you're using the `anon` key, not the `service_role` key
- Check that Row Level Security policies are set up correctly

## Benefits of Supabase

- ✅ **Real-time updates** - Changes appear instantly across all users
- ✅ **Reliable storage** - No data loss, backed up automatically
- ✅ **Scalable** - Handles multiple users simultaneously
- ✅ **Free tier** - 500MB database, 2GB bandwidth
- ✅ **Easy setup** - No complex configuration needed
- ✅ **PostgreSQL** - Industry-standard database
- ✅ **Real-time subscriptions** - WebSocket-based updates

## Security

The current setup uses Row Level Security (RLS) with a policy that allows public read/write access. This is perfect for team collaboration. For production use, you can:

1. Add user authentication
2. Set up more restrictive RLS policies
3. Use API keys for different access levels

But for now, the public access policy works perfectly for team collaboration!