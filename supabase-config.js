// Supabase Configuration for BratBox
// Replace these with your actual Supabase project credentials

const SUPABASE_CONFIG = {
    url: 'https://dpnacykpxtgdxufhdiab.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbmFjeWtweHRnZHh1ZmhkaWFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5ODI2NTIsImV4cCI6MjA3MjU1ODY1Mn0.fl-GjnXFxAZYYy2-bGbslEpe0FQYGLdNVolSxAZkSik'
};

// Initialize Supabase client (using IIFE to avoid conflicts)
(function() {
    'use strict';
    
    // Store the Supabase client instance
    let supabaseClient = null;
    
    // Initialize Supabase (call this after loading the Supabase library)
    window.initSupabase = function() {
        console.log('Initializing Supabase...');
        console.log('Window supabase available:', typeof window.supabase !== 'undefined');
        console.log('Config:', SUPABASE_CONFIG);
        
        // Check if the global supabase object exists
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library not loaded. Please include the Supabase CDN script.');
            return false;
        }
        
        try {
            supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
            console.log('Supabase client created successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Supabase:', error);
            return false;
        }
    };
    
    // Get the Supabase client instance
    window.getSupabaseClient = function() {
        return supabaseClient;
    };
})();

// Database operations
class SupabaseStorage {
    constructor() {
        this.isInitialized = false;
        this.initPromise = this.initialize();
    }

    async initialize() {
        // Wait for Supabase to be available
        let attempts = 0;
        while (typeof window.supabase === 'undefined' && attempts < 50) {
            console.log(`Waiting for Supabase library... attempt ${attempts + 1}`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts >= 50) {
            console.error('Supabase library failed to load after 5 seconds');
            this.isInitialized = false;
            return false;
        }
        
        this.isInitialized = window.initSupabase();
        return this.isInitialized;
    }

    // Load all data from Supabase
    async load() {
        console.log('Attempting to load from Supabase...');
        await this.initPromise;
        
        if (!this.isInitialized) {
            console.log('Supabase not initialized, using localStorage fallback');
            return this.loadFromLocalStorage();
        }

        try {
            console.log('Querying Supabase for data...');
            const supabaseClient = window.getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            const { data, error } = await supabaseClient
                .from('bratbox_data')
                .select('*')
                .eq('id', 1)
                .single();

            console.log('Supabase response:', { data, error });

            if (error) {
                if (error.code === 'PGRST116') {
                    // No data found, return empty structure
                    console.log('No data found in Supabase, returning empty structure');
                    return {
                        epics: [],
                        stories: [],
                        sprintStories: [],
                        nextEpicNumber: 1,
                        nextStoryNumber: 1
                    };
                }
                console.error('Error loading from Supabase:', error);
                console.log('Falling back to localStorage');
                return this.loadFromLocalStorage();
            }

            if (data) {
                console.log('Data loaded from Supabase:', data);
                const result = {
                    epics: data.epics || [],
                    stories: data.stories || [],
                    sprintStories: data.sprint_stories || [],
                    nextEpicNumber: data.next_epic_number || 1,
                    nextStoryNumber: data.next_story_number || 1
                };
                console.log('Processed data:', result);
                return result;
            } else {
                console.log('No data returned from Supabase');
                return {
                    epics: [],
                    stories: [],
                    sprintStories: [],
                    nextEpicNumber: 1,
                    nextStoryNumber: 1
                };
            }
        } catch (error) {
            console.error('Error loading from Supabase:', error);
            console.log('Falling back to localStorage');
            return this.loadFromLocalStorage();
        }
    }

    // Save all data to Supabase
    async save(data) {
        console.log('Attempting to save to Supabase...');
        await this.initPromise;
        
        if (!this.isInitialized) {
            console.log('Supabase not initialized, using localStorage fallback');
            this.saveToLocalStorage(data);
            return false;
        }

        try {
            console.log('Saving data to Supabase:', data);
            const supabaseClient = window.getSupabaseClient();
            if (!supabaseClient) {
                throw new Error('Supabase client not initialized');
            }
            const { error } = await supabaseClient
                .from('bratbox_data')
                .upsert({
                    id: 1,
                    epics: data.epics,
                    stories: data.stories,
                    sprint_stories: data.sprintStories,
                    next_epic_number: data.nextEpicNumber,
                    next_story_number: data.nextStoryNumber,
                    updated_at: new Date().toISOString()
                });

            console.log('Supabase save response:', { error });

            if (error) {
                console.error('Error saving to Supabase:', error);
                console.log('Falling back to localStorage');
                this.saveToLocalStorage(data);
                return false;
            }

            console.log('Data saved to Supabase successfully');
            // Also save to localStorage as backup
            this.saveToLocalStorage(data);
            return true;
        } catch (error) {
            console.error('Error saving to Supabase:', error);
            console.log('Falling back to localStorage');
            this.saveToLocalStorage(data);
            return false;
        }
    }

    // Start polling for changes (alternative to real-time subscriptions)
    startPolling(callback, interval = 3000) {
        if (!this.isInitialized) {
            console.log('Supabase not initialized, polling disabled');
            return;
        }

        console.log(`Starting polling every ${interval}ms`);
        
        // Poll for changes every 3 seconds
        this.pollingInterval = setInterval(async () => {
            try {
                const data = await this.load();
                if (data) {
                    callback(data);
                }
            } catch (error) {
                console.error('Error during polling:', error);
            }
        }, interval);
    }

    // Stop polling
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
            console.log('Polling stopped');
        }
    }

    // Local storage fallback methods
    loadFromLocalStorage() {
        return {
            epics: this.getFromStorage('bratbox_epics') || [],
            stories: this.getFromStorage('bratbox_stories') || [],
            sprintStories: this.getFromStorage('bratbox_sprint_stories') || [],
            nextEpicNumber: this.getFromStorage('bratbox_next_epic_number') || 1,
            nextStoryNumber: this.getFromStorage('bratbox_next_story_number') || 1
        };
    }

    saveToLocalStorage(data) {
        this.setToStorage('bratbox_epics', data.epics);
        this.setToStorage('bratbox_stories', data.stories);
        this.setToStorage('bratbox_sprint_stories', data.sprintStories);
        this.setToStorage('bratbox_next_epic_number', data.nextEpicNumber);
        this.setToStorage('bratbox_next_story_number', data.nextStoryNumber);
    }

    getFromStorage(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    setToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
}

// Test function to verify Supabase connection
async function testSupabaseConnection() {
    console.log('Testing Supabase connection...');
    const storage = new SupabaseStorage();
    await storage.initPromise;
    
    if (storage.isInitialized) {
        console.log('✅ Supabase connection successful');
        
        // Try to load data
        const data = await storage.load();
        console.log('✅ Data loaded:', data);
        
        // Try to save test data
        const testData = {
            epics: [{ id: 'test', title: 'Test Epic', description: 'Test' }],
            stories: [],
            sprintStories: [],
            nextEpicNumber: 1,
            nextStoryNumber: 1
        };
        
        const saved = await storage.save(testData);
        console.log('✅ Data saved:', saved);
        
        return true;
    } else {
        console.log('❌ Supabase connection failed');
        return false;
    }
}

// Export for use in main app
window.SupabaseStorage = SupabaseStorage;
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.testSupabaseConnection = testSupabaseConnection;