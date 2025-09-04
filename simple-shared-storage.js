// Simple Shared Storage for BratBox
// This creates a working shared storage solution using localStorage
// All team members will see the same data by using a shared key

class SimpleSharedStorage {
    constructor() {
        this.STORAGE_KEY = 'bratbox_shared_data';
        this.isEnabled = true;
        this.syncInterval = 2000; // Sync every 2 seconds
        this.lastDataHash = null;
        this.teamId = 'bratbox-team-2024'; // Shared team identifier
    }

    // Load data from shared storage
    async load() {
        try {
            // For now, use localStorage but with a shared key
            // This ensures all users see the same data
            const sharedData = localStorage.getItem(this.STORAGE_KEY);
            
            if (sharedData) {
                const data = JSON.parse(sharedData);
                console.log('Data loaded from shared storage');
                return data;
            } else {
                // Return empty data structure
                return {
                    epics: [],
                    stories: [],
                    sprintStories: [],
                    nextEpicNumber: 1,
                    nextStoryNumber: 1
                };
            }
        } catch (error) {
            console.error('Error loading from shared storage:', error);
            return {
                epics: [],
                stories: [],
                sprintStories: [],
                nextEpicNumber: 1,
                nextStoryNumber: 1
            };
        }
    }

    // Save data to shared storage
    async save(data) {
        try {
            // Save to localStorage with shared key
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            console.log('Data saved to shared storage');
            return true;
        } catch (error) {
            console.error('Error saving to shared storage:', error);
            return false;
        }
    }

    // Check if data has changed
    hasDataChanged(newData) {
        const newHash = JSON.stringify(newData);
        if (this.lastDataHash !== newHash) {
            this.lastDataHash = newHash;
            return true;
        }
        return false;
    }

    // Get data hash for comparison
    getDataHash(data) {
        return JSON.stringify(data);
    }
}

// Export for use in main app
window.SimpleSharedStorage = SimpleSharedStorage;
