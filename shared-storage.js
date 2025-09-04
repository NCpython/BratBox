// BratBox Shared Storage Implementation
// This file provides shared storage functionality for team collaboration

class SharedStorage {
    constructor() {
        // Using a simple approach with a free JSON storage service
        this.STORAGE_URL = 'https://api.npoint.io/8f8b8b8b8b8b8b8b8b8b'; // Free JSON storage
        this.STORAGE_KEY = 'bratbox_data';
        this.isEnabled = true; // Enable by default for immediate use
        this.lastSyncTime = 0;
        this.syncInterval = 3000; // Sync every 3 seconds
    }

    // Enable shared storage (call this after setting up your storage service)
    enable() {
        this.isEnabled = true;
        console.log('Shared storage enabled');
    }

    // Load data from shared storage
    async load() {
        try {
            if (!this.isEnabled) {
                console.log('Shared storage not enabled, using localStorage');
                return this.loadFromLocalStorage();
            }

            const response = await fetch(this.STORAGE_URL);
            if (!response.ok) {
                throw new Error('Failed to load from shared storage');
            }
            
            const data = await response.json();
            const sharedData = data[this.STORAGE_KEY];
            
            if (sharedData) {
                console.log('Data loaded from shared storage');
                return sharedData;
            } else {
                console.log('No shared data found, using localStorage');
                return this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading from shared storage:', error);
            console.log('Falling back to localStorage');
            return this.loadFromLocalStorage();
        }
    }

    // Save data to shared storage
    async save(data) {
        try {
            // Always save to localStorage as backup
            this.saveToLocalStorage(data);
            
            if (!this.isEnabled) {
                console.log('Shared storage not enabled, saved to localStorage only');
                return;
            }

            const dataToSave = {
                [this.STORAGE_KEY]: {
                    ...data,
                    lastUpdated: new Date().toISOString()
                }
            };

            const response = await fetch(this.STORAGE_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                throw new Error('Failed to save to shared storage');
            }

            console.log('Data saved to shared storage');
        } catch (error) {
            console.error('Error saving to shared storage:', error);
            console.log('Data saved to localStorage only');
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

// Export for use in main app
window.SharedStorage = SharedStorage;
