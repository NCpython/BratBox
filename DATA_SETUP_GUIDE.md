# Data Setup Guide - Making Data Appear in BratBox

Since you've already set up the schema in Supabase, here's what you need to do to see data in your application:

## ✅ What's Already Done

1. ✅ Database schema created (`bratbox_data` table)
2. ✅ Supabase credentials configured in `supabase-config.js`
3. ✅ Application code ready to connect

## 📋 Step-by-Step Process

### Step 1: Verify Supabase Connection

1. **Open your application** in a browser (using local server)
   ```bash
   cd /Users/nishantchaturvedi/Desktop/BratBox
   python3 -m http.server 8000
   ```
   Then open: http://localhost:8000

2. **Open Browser Console** (Press F12 or Cmd+Option+I)

3. **Look for these success messages:**
   ```
   ✅ Supabase client created successfully
   ✅ Attempting to load from Supabase...
   ✅ Data loaded from Supabase: {...}
   ```

4. **If you see errors**, check:
   - Supabase URL is correct in `supabase-config.js`
   - Anon key is correct
   - Table `bratbox_data` exists in Supabase
   - Row Level Security policies are set up

### Step 2: Initial State (Empty Database)

**Important:** When you first set up the schema, the table will be **empty** (or have an empty row with `id = 1`).

The app will show:
- Empty Epics column
- Empty User Stories column
- "No Epics Yet" / "No User Stories Yet" messages

**This is normal!** You need to create data first.

### Step 3: Create Your First Data

To populate the database and see data:

1. **Click "Add Epic"** button in the app
2. Fill in the form:
   - Title: e.g., "User Authentication"
   - Description: e.g., "Implement user login and registration"
   - Priority: Select from dropdown
   - Success Criteria: (optional)
   - Goals: (optional)
3. **Click "Add Item"**

4. **Check Browser Console** - You should see:
   ```
   ✅ Data saved to Supabase successfully
   ```

5. **Verify in Supabase Dashboard:**
   - Go to Supabase Dashboard → Table Editor
   - Select `bratbox_data` table
   - Click on row with `id = 1`
   - You should see your epic in the `epics` JSONB column

### Step 4: Create User Stories

1. **Click "Add User Story"** button
2. Fill in the form:
   - Title: e.g., "User Login Form"
   - Description: e.g., "As a user, I want to log in..."
   - Priority: Select from dropdown
   - Story Points: Select (e.g., 3)
   - Assign to Epic: (optional - select the epic you created)
   - Assign to User: (optional)
3. **Click "Add Item"**

4. **Data should appear immediately** in the User Stories column

### Step 5: Verify Data Persistence

1. **Refresh the browser page** (F5 or Cmd+R)
2. **Data should still be there** - it's loading from Supabase!
3. **Check console** for: `✅ Data loaded from Supabase`

### Step 6: Test Real-Time Sync (Optional)

1. **Open the app in two browser tabs/windows**
2. **Create an epic in Tab 1**
3. **Wait 3 seconds** (polling interval)
4. **Check Tab 2** - the epic should appear automatically!

## 🔍 Verification Checklist

Use this checklist to verify everything is working:

- [ ] Browser console shows: `✅ Supabase client created successfully`
- [ ] Browser console shows: `✅ Data loaded from Supabase`
- [ ] No error messages in console
- [ ] Can create an epic successfully
- [ ] Epic appears in the UI immediately
- [ ] Console shows: `✅ Data saved to Supabase successfully`
- [ ] Data persists after page refresh
- [ ] Can see data in Supabase Dashboard → Table Editor

## 🐛 Troubleshooting

### Issue: "Supabase not initialized"

**Solution:**
1. Check that Supabase CDN script loads in `index.html`
2. Verify network tab shows successful load of `@supabase/supabase-js@2`
3. Check browser console for any script loading errors

### Issue: "Error loading from Supabase" or "PGRST116"

**Solution:**
1. Verify the initial row exists:
   ```sql
   SELECT * FROM bratbox_data WHERE id = 1;
   ```
2. If no row exists, run:
   ```sql
   INSERT INTO bratbox_data (id) VALUES (1);
   ```

### Issue: "Error saving to Supabase"

**Solution:**
1. Check Row Level Security policies:
   - Go to Supabase Dashboard → Authentication → Policies
   - Verify policy "Allow all operations on bratbox_data" exists
2. Check table permissions:
   ```sql
   GRANT ALL ON bratbox_data TO anon;
   ```

### Issue: Data doesn't appear after creating

**Solution:**
1. Check browser console for errors
2. Verify data was saved: Check Supabase Dashboard → Table Editor
3. Check if data is in correct format (JSONB arrays)
4. Try refreshing the page

### Issue: "No data found in Supabase"

**This is normal for a fresh setup!** The table is empty. Just create your first epic/story and it will populate.

## 📊 Expected Database Structure

After creating data, your `bratbox_data` table should look like:

```json
{
  "id": 1,
  "epics": [
    {
      "id": "abc123",
      "number": 1,
      "title": "User Authentication",
      "description": "...",
      "priority": "high",
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "stories": [
    {
      "id": "def456",
      "number": 1,
      "title": "User Login Form",
      "description": "...",
      "priority": "medium",
      "storyPoints": 3,
      "createdAt": "2024-01-15T10:05:00Z"
    }
  ],
  "sprint_stories": [],
  "next_epic_number": 2,
  "next_story_number": 2
}
```

## 🎯 Quick Test

Run this in your browser console after the page loads:

```javascript
// Test Supabase connection
testSupabaseConnection();

// Check if data loads
const storage = new SupabaseStorage();
await storage.initPromise;
const data = await storage.load();
console.log('Loaded data:', data);
```

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Console shows successful Supabase connection
2. ✅ Can create epics and stories
3. ✅ Data appears immediately in UI
4. ✅ Data persists after refresh
5. ✅ Can see data in Supabase Dashboard
6. ✅ Real-time sync works (if testing with multiple tabs)

## 🚀 Next Steps

Once data is appearing:

1. **Create more epics and stories** to populate your backlog
2. **Test sprint planning** - add stories to sprint
3. **Test drag-and-drop** - move stories between statuses
4. **Test team collaboration** - open in multiple browsers/tabs

---

**Remember:** The database starts empty. You need to create data through the UI first, then it will be saved to and loaded from Supabase!

