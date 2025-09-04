// BratBox - Product Backlog Application
class BratBoxApp {
    constructor() {
        // Initialize Supabase storage
        this.sharedStorage = new SupabaseStorage();
        
        // Initialize with empty data - will be loaded from shared storage
        this.epics = [];
        this.stories = [];
        this.users = this.getDefaultUsers();
        this.sprintStories = [];
        this.currentItemType = 'epic';
        this.nextEpicNumber = 1;
        this.nextStoryNumber = 1;
        this.currentSection = 'backlog';
        
        this.initializeApp();
    }

    getDefaultUsers() {
        return [
            { id: 'user1', name: 'Noman Alvi', email: 'noman@example.com', avatar: '👨‍💻', color: '#667eea', role: 'Developer' },
            { id: 'user2', name: 'Waleed Arshad', email: 'waleed@example.com', avatar: '🧪', color: '#f093fb', role: 'Tester' },
            { id: 'user3', name: 'Nishant Chaturvedi', email: 'nishant@example.com', avatar: '👨‍🔧', color: '#4facfe', role: 'DevOps' },
            { id: 'user4', name: 'Smit Unagar', email: 'smit@example.com', avatar: '👨‍💼', color: '#43e97b', role: 'Product Owner' },
            { id: 'user5', name: 'Sampoorna Sahoo', email: 'sampoorna@example.com', avatar: '👩‍🏫', color: '#fa709a', role: 'Scrum Master' }
        ];
    }

    async initializeApp() {
        // Clear any existing sample data from localStorage
        this.clearSampleData();
        
        // Load data from shared storage
        await this.loadFromSharedStorage();
        
        // Debug: Log users to console
        console.log('Current users:', this.users);
        
        this.bindEvents();
        this.renderEpics();
        this.renderStories();
        this.updateEmptyStates();
        
        // Start real-time sync with Supabase
        this.startRealTimeSync();
    }

    bindEvents() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.getAttribute('data-section');
                this.switchSection(section);
            });
        });

        // Modal controls
        document.getElementById('addEpicBtn').addEventListener('click', () => this.openModal('epic'));
        document.getElementById('addStoryBtn').addEventListener('click', () => this.openModal('story'));
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        
        // Sprint Planning controls
        document.getElementById('createSprintBtn').addEventListener('click', () => this.createSprint());
        document.getElementById('addFromBacklogBtn').addEventListener('click', () => this.addFromBacklog());
        document.getElementById('clearSprintBtn').addEventListener('click', () => this.clearSprint());
        
        // Story Details Modal controls
        document.getElementById('closeStoryDetailsModal').addEventListener('click', () => this.closeStoryDetailsModal());
        document.getElementById('closeDetailsBtn').addEventListener('click', () => this.closeStoryDetailsModal());
        document.getElementById('editStoryBtn').addEventListener('click', () => this.editStoryFromDetails());
        
        // Comments controls
        document.getElementById('addCommentBtn').addEventListener('click', () => this.addComment());
        
        // Backlog Selection Modal controls
        document.getElementById('closeBacklogSelectionModal').addEventListener('click', () => this.closeBacklogSelectionModal());
        document.getElementById('cancelBacklogSelectionBtn').addEventListener('click', () => this.closeBacklogSelectionModal());
        document.getElementById('addSelectedStoriesBtn').addEventListener('click', () => this.addSelectedStories());
        document.getElementById('selectAllBtn').addEventListener('click', () => this.selectAllStories());
        document.getElementById('selectNoneBtn').addEventListener('click', () => this.selectNoneStories());
        document.getElementById('clearSearchBtn').addEventListener('click', () => this.clearSearch());
        document.getElementById('backlogSearchInput').addEventListener('input', (e) => this.filterStories(e.target.value));
        
        // Form submission
        document.getElementById('addItemForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Close modal on backdrop click
        document.getElementById('addItemModal').addEventListener('click', (e) => {
            if (e.target.id === 'addItemModal') {
                this.closeModal();
            }
        });

        document.getElementById('storyDetailsModal').addEventListener('click', (e) => {
            if (e.target.id === 'storyDetailsModal') {
                this.closeStoryDetailsModal();
            }
        });

        document.getElementById('backlogSelectionModal').addEventListener('click', (e) => {
            if (e.target.id === 'backlogSelectionModal') {
                this.closeBacklogSelectionModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
                this.closeStoryDetailsModal();
                this.closeBacklogSelectionModal();
            }
        });

        // Initialize drag and drop for sprint columns
        this.initializeDragAndDrop();
    }

    openModal(type, isEditMode = false) {
        this.currentItemType = type;
        const modal = document.getElementById('addItemModal');
        const modalTitle = document.getElementById('modalTitle');
        const storyPointsGroup = document.getElementById('storyPointsGroup');
        const epicAssignmentGroup = document.getElementById('epicAssignmentGroup');
        const userAssignmentGroup = document.getElementById('userAssignmentGroup');
        
        modalTitle.textContent = isEditMode 
            ? (type === 'epic' ? 'Edit Epic' : 'Edit User Story')
            : (type === 'epic' ? 'Add Epic' : 'Add User Story');
        storyPointsGroup.style.display = type === 'story' ? 'block' : 'none';
        epicAssignmentGroup.style.display = type === 'story' ? 'block' : 'none';
        userAssignmentGroup.style.display = type === 'story' ? 'block' : 'none';
        
        // Populate dropdowns for user stories
        if (type === 'story') {
            this.populateEpicDropdown();
            this.populateUserDropdown();
        }
        
        // Only clear form if not in edit mode
        if (!isEditMode) {
            document.getElementById('addItemForm').reset();
            // Set default priority
            document.getElementById('itemPriority').value = 'medium';
        }
        
        // Update submit button text
        const submitButton = document.querySelector('#addItemForm button[type="submit"]');
        submitButton.textContent = isEditMode 
            ? (type === 'epic' ? 'Update Epic' : 'Update User Story')
            : (type === 'epic' ? 'Add Epic' : 'Add User Story');
        
        modal.classList.add('show');
        document.getElementById('itemTitle').focus();
    }

    closeModal() {
        document.getElementById('addItemModal').classList.remove('show');
        // Clear editing state when modal is closed
        this.currentEditingItem = null;
        this.currentEditingType = null;
    }

    switchSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Hide all sections
        document.querySelectorAll('.section-container').forEach(container => {
            container.style.display = 'none';
        });

        // Show selected section
        document.getElementById(`${section}-section`).style.display = 'block';
        this.currentSection = section;

        // Render appropriate content
        if (section === 'sprint-planning') {
            this.renderSprintBoard();
        }
    }

    populateEpicDropdown() {
        const epicDropdown = document.getElementById('itemEpicId');
        epicDropdown.innerHTML = '<option value="">No Epic (Standalone Story)</option>';
        
        this.epics.forEach(epic => {
            const option = document.createElement('option');
            option.value = epic.id;
            option.textContent = `E${epic.number}: ${epic.title}`;
            epicDropdown.appendChild(option);
        });
    }

    populateUserDropdown() {
        const userDropdown = document.getElementById('itemUserId');
        userDropdown.innerHTML = '<option value="">Unassigned</option>';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.avatar} ${user.name} (${user.role})`;
            userDropdown.appendChild(option);
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Check if we're in edit mode
        if (this.currentEditingItem) {
            // Update existing item
            this.currentEditingItem.title = formData.get('title');
            this.currentEditingItem.description = formData.get('description');
            this.currentEditingItem.priority = formData.get('priority');
            
            if (this.currentEditingType === 'story') {
                this.currentEditingItem.storyPoints = parseInt(formData.get('storyPoints'));
                this.currentEditingItem.epicId = formData.get('epicId') || null;
                this.currentEditingItem.assignedUserId = formData.get('userId') || null;
            }

            this.saveToSharedStorage();
            
            if (this.currentEditingType === 'epic') {
                this.renderEpics();
            } else {
                this.renderStories();
            }

            this.closeModal();
            this.showNotification(`${this.currentEditingType === 'epic' ? 'Epic' : 'User Story'} updated successfully!`);
            
            // Clear editing state
            this.currentEditingItem = null;
            this.currentEditingType = null;
        } else {
            // Create new item
            const item = {
                id: this.generateId(),
                number: this.currentItemType === 'epic' ? this.nextEpicNumber++ : this.nextStoryNumber++,
                title: formData.get('title'),
                description: formData.get('description'),
                priority: formData.get('priority'),
                createdAt: new Date().toISOString(),
                storyPoints: this.currentItemType === 'story' ? parseInt(formData.get('storyPoints')) : null,
                epicId: this.currentItemType === 'story' ? formData.get('epicId') || null : null,
                assignedUserId: this.currentItemType === 'story' ? formData.get('userId') || null : null
            };

            if (this.currentItemType === 'epic') {
                this.epics.push(item);
                this.saveToSharedStorage();
                this.renderEpics();
            } else {
                this.stories.push(item);
                this.saveToSharedStorage();
                this.renderStories();
            }

            this.closeModal();
            this.updateEmptyStates();
            this.showNotification(`${this.currentItemType === 'epic' ? 'Epic' : 'User Story'} added successfully!`);
        }
    }

    renderEpics() {
        const container = document.getElementById('epicsContainer');
        container.innerHTML = '';

        if (this.epics.length === 0) {
            container.innerHTML = this.createEmptyState('epic');
            return;
        }

        this.epics.forEach(epic => {
            const epicElement = this.createStickyNote(epic, 'epic');
            container.appendChild(epicElement);
        });
    }

    renderStories() {
        const container = document.getElementById('storiesContainer');
        container.innerHTML = '';

        if (this.stories.length === 0) {
            container.innerHTML = this.createEmptyState('story');
            return;
        }

        this.stories.forEach(story => {
            const storyElement = this.createStickyNote(story, 'story');
            container.appendChild(storyElement);
        });
    }

    createStickyNote(item, type) {
        const note = document.createElement('div');
        note.className = `sticky-note ${type} priority-${item.priority}`;
        note.draggable = true;
        
        // Get epic name if this is a story with an epic assignment
        let epicInfo = '';
        if (type === 'story' && item.epicId) {
            const epic = this.epics.find(e => e.id === item.epicId);
            if (epic) {
                epicInfo = `<div class="epic-assignment">📋 Epic ${epic.number}: ${this.escapeHtml(epic.title)}</div>`;
            }
        }

        // Get assigned user info
        let userInfo = '';
        if (type === 'story' && item.assignedUserId) {
            const user = this.users.find(u => u.id === item.assignedUserId);
            if (user) {
                userInfo = `<div class="user-assignment">${user.avatar} Assigned to: ${this.escapeHtml(user.name)}</div>`;
            }
        }
        
        // Get comment count for this item
        const commentCount = this.getCommentsForItem(item.id).length;
        const commentInfo = commentCount > 0 ? `<div class="comment-count">💬 ${commentCount}</div>` : '';

        note.innerHTML = `
            <div class="sticky-note-header">
                <h4 class="sticky-note-title">
                    <span class="item-number">${type === 'epic' ? 'E' : 'US'}${item.number}</span>
                    ${this.escapeHtml(item.title)}
                </h4>
                <div class="sticky-note-actions">
                    <button class="action-btn edit" onclick="app.editItem('${item.id}', '${type}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="app.deleteItem('${item.id}', '${type}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="sticky-note-description">${this.escapeHtml(item.description || 'No description provided')}</div>
            ${epicInfo}
            ${userInfo}
            ${commentInfo}
            <div class="sticky-note-footer">
                <span class="priority-badge priority-${item.priority}">${item.priority}</span>
                ${item.storyPoints ? `<span class="story-points">${item.storyPoints} pts</span>` : ''}
            </div>
        `;

        // Add click event listener for details view (for epics)
        if (type === 'epic') {
            note.addEventListener('click', (e) => {
                // Don't open details if clicking on action buttons
                if (!e.target.closest('.sticky-note-actions')) {
                    this.showEpicDetails(item);
                }
            });
        }

        // Add drag and drop functionality
        note.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                id: item.id,
                type: type
            }));
        });

        return note;
    }

    createEmptyState(type) {
        const icon = type === 'epic' ? 'fas fa-layer-group' : 'fas fa-tasks';
        const title = type === 'epic' ? 'No Epics Yet' : 'No User Stories Yet';
        const description = type === 'epic' 
            ? 'Create your first epic to organize related user stories'
            : 'Add user stories to start building your product backlog';

        return `
            <div class="empty-state">
                <i class="${icon}"></i>
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;
    }

    editItem(id, type) {
        const items = type === 'epic' ? this.epics : this.stories;
        const item = items.find(i => i.id === id);
        
        if (!item) return;

        // Store the item being edited
        this.currentEditingItem = item;
        this.currentEditingType = type;

        // Pre-fill the form with existing data
        document.getElementById('itemTitle').value = item.title;
        document.getElementById('itemDescription').value = item.description || '';
        document.getElementById('itemPriority').value = item.priority;
        
        if (type === 'story' && item.storyPoints) {
            document.getElementById('itemStoryPoints').value = item.storyPoints;
        }
        
        if (type === 'story' && item.epicId) {
            document.getElementById('itemEpicId').value = item.epicId;
        }
        
        if (type === 'story' && item.assignedUserId) {
            document.getElementById('itemUserId').value = item.assignedUserId;
        }

        // Open modal in edit mode
        this.openModal(type, true);
    }

    deleteItem(id, type) {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) {
            return;
        }

        const items = type === 'epic' ? this.epics : this.stories;
        const index = items.findIndex(i => i.id === id);
        
        if (index > -1) {
            items.splice(index, 1);
            this.saveToSharedStorage();
            
            if (type === 'epic') {
                this.renderEpics();
            } else {
                this.renderStories();
            }
            
            this.updateEmptyStates();
            this.showNotification(`${type === 'epic' ? 'Epic' : 'User Story'} deleted successfully!`);
        }
    }

    updateEmptyStates() {
        // This method is called after rendering to ensure empty states are shown correctly
        // The rendering methods already handle empty states, so this is a placeholder for future enhancements
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Shared Storage Methods
    async loadFromSharedStorage() {
        try {
            const data = await this.sharedStorage.load();
            this.epics = data.epics || [];
            this.stories = data.stories || [];
            this.sprintStories = data.sprintStories || [];
            this.nextEpicNumber = data.nextEpicNumber || 1;
            this.nextStoryNumber = data.nextStoryNumber || 1;
            
            // Always use default users
            this.users = this.getDefaultUsers();
            
            console.log('Data loaded from shared storage');
        } catch (error) {
            console.error('Error loading from shared storage:', error);
            // Fallback to empty data
            this.epics = [];
            this.stories = [];
            this.sprintStories = [];
        }
    }

    async saveToSharedStorage() {
        try {
            const data = {
                epics: this.epics,
                stories: this.stories,
                sprintStories: this.sprintStories,
                nextEpicNumber: this.nextEpicNumber,
                nextStoryNumber: this.nextStoryNumber
            };
            
            await this.sharedStorage.save(data);
            console.log('Data saved to shared storage');
        } catch (error) {
            console.error('Error saving to shared storage:', error);
        }
    }

    // Clear any existing sample data from localStorage
    clearSampleData() {
        try {
            // Clear all BratBox related data from localStorage
            const keysToRemove = [
                'bratbox_epics',
                'bratbox_stories', 
                'bratbox_sprint_stories',
                'bratbox_comments',
                'bratbox_next_epic_number',
                'bratbox_next_story_number',
                'bratbox_users'
            ];
            
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
            });
            
            console.log('Cleared sample data from localStorage');
        } catch (error) {
            console.error('Error clearing sample data:', error);
        }
    }

    // Polling-based sync with Supabase (works in all regions)
    startRealTimeSync() {
        // Start polling for changes every 3 seconds
        this.sharedStorage.startPolling((data) => {
            // Check if data has actually changed to avoid unnecessary re-renders
            const currentData = {
                epics: this.epics,
                stories: this.stories,
                sprintStories: this.sprintStories,
                nextEpicNumber: this.nextEpicNumber,
                nextStoryNumber: this.nextStoryNumber
            };
            
            const newData = {
                epics: data.epics || [],
                stories: data.stories || [],
                sprintStories: data.sprintStories || [],
                nextEpicNumber: data.nextEpicNumber || 1,
                nextStoryNumber: data.nextStoryNumber || 1
            };
            
            const dataChanged = JSON.stringify(currentData) !== JSON.stringify(newData);
            
            if (dataChanged) {
                // Update local data
                this.epics = newData.epics;
                this.stories = newData.stories;
                this.sprintStories = newData.sprintStories;
                this.nextEpicNumber = newData.nextEpicNumber;
                this.nextStoryNumber = newData.nextStoryNumber;
                
                // Re-render UI
                this.renderEpics();
                this.renderStories();
                if (this.currentSection === 'sprint-planning') {
                    this.renderSprintBoard();
                }
                
                console.log('Data synced from Supabase (polling)');
            }
        }, 3000); // Poll every 3 seconds
    }


    // Local Storage Methods (fallback)
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            this.showNotification('Error saving data. Please try again.', 'error');
        }
    }

    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Sprint Planning Methods
    createSprint() {
        // For now, just show a notification
        this.showNotification('Sprint created! You can now add stories from the backlog.');
    }

    addFromBacklog() {
        // Show available stories from backlog that aren't already in sprint
        const availableStories = this.stories.filter(story => 
            !this.sprintStories.some(sprintStory => sprintStory.id === story.id)
        );

        if (availableStories.length === 0) {
            this.showNotification('No available stories in backlog to add to sprint.', 'error');
            return;
        }

        // Open the backlog selection modal
        this.openBacklogSelectionModal(availableStories);
    }

    renderSprintBoard() {
        const statuses = ['todo', 'in-progress', 'testing', 'testing-completed', 'review', 'live'];
        
        statuses.forEach(status => {
            const column = document.getElementById(`${status}-column`);
            const countElement = document.getElementById(`${status}-count`);
            
            // Clear column
            column.innerHTML = '';
            
            // Get stories for this status
            const storiesInStatus = this.sprintStories.filter(story => story.sprintStatus === status);
            
            // Update count
            countElement.textContent = storiesInStatus.length;
            
            // Add stories to column
            storiesInStatus.forEach(story => {
                const storyCard = this.createSprintStoryCard(story);
                column.appendChild(storyCard);
            });
        });
    }

    createSprintStoryCard(story) {
        const card = document.createElement('div');
        card.className = 'sprint-story-card';
        card.draggable = true;
        card.dataset.storyId = story.id;

        // Get assigned user info
        const assignedUser = story.assignedUserId ? 
            this.users.find(u => u.id === story.assignedUserId) : null;

        // Get epic info
        const epic = story.epicId ? 
            this.epics.find(e => e.id === story.epicId) : null;

        card.innerHTML = `
            <div class="sprint-story-header">
                <div class="sprint-story-title">
                    <span class="sprint-story-number">US${story.number}</span>
                    ${this.escapeHtml(story.title)}
                </div>
                <div class="sprint-story-actions">
                    <button class="sprint-action-btn remove" onclick="app.removeFromSprint('${story.id}')" title="Remove from Sprint">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="sprint-story-description">
                ${this.escapeHtml(story.description || 'No description')}
            </div>
            <div class="sprint-story-meta">
                <div class="sprint-story-assignee">
                    ${assignedUser ? `${assignedUser.avatar} ${assignedUser.name} (${assignedUser.role})` : 'Unassigned'}
                </div>
                <div class="sprint-story-points">${story.storyPoints || 0} pts</div>
            </div>
        `;

        // Add click event listener for details view
        card.addEventListener('click', (e) => {
            // Don't open details if dragging or clicking on action buttons
            if (!card.classList.contains('dragging') && !e.target.closest('.sprint-story-actions')) {
                this.showStoryDetails(story);
            }
        });

        // Add drag event listeners
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', story.id);
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });

        return card;
    }

    initializeDragAndDrop() {
        const columns = document.querySelectorAll('.sprint-column');
        
        columns.forEach(column => {
            column.addEventListener('dragover', (e) => {
                e.preventDefault();
                column.classList.add('drag-over');
            });

            column.addEventListener('dragleave', () => {
                column.classList.remove('drag-over');
            });

            column.addEventListener('drop', (e) => {
                e.preventDefault();
                column.classList.remove('drag-over');
                
                const storyId = e.dataTransfer.getData('text/plain');
                const newStatus = column.dataset.status;
                
                this.moveStoryToStatus(storyId, newStatus);
            });
        });
    }

    moveStoryToStatus(storyId, newStatus) {
        const storyIndex = this.sprintStories.findIndex(story => story.id === storyId);
        
        if (storyIndex !== -1) {
            this.sprintStories[storyIndex].sprintStatus = newStatus;
            this.saveToSharedStorage();
            this.renderSprintBoard();
            this.showNotification(`Story moved to ${newStatus.replace('-', ' ')}`);
        }
    }

    removeFromSprint(storyId) {
        const story = this.sprintStories.find(s => s.id === storyId);
        if (!story) return;

        const storyTitle = story.title;
        
        if (!confirm(`Are you sure you want to remove "${storyTitle}" from the sprint?`)) {
            return;
        }

        // Remove story from sprint
        this.sprintStories = this.sprintStories.filter(s => s.id !== storyId);
        this.saveToStorage('bratbox_sprint_stories', this.sprintStories);
        
        // Re-render the sprint board
        this.renderSprintBoard();
        
        this.showNotification(`"${storyTitle}" removed from sprint successfully!`);
    }

    clearSprint() {
        if (this.sprintStories.length === 0) {
            this.showNotification('Sprint is already empty.', 'error');
            return;
        }

        if (!confirm(`Are you sure you want to remove all ${this.sprintStories.length} stories from the sprint? This action cannot be undone.`)) {
            return;
        }

        // Clear all stories from sprint
        this.sprintStories = [];
        this.saveToStorage('bratbox_sprint_stories', this.sprintStories);
        
        // Re-render the sprint board
        this.renderSprintBoard();
        
        this.showNotification('All stories removed from sprint successfully!');
    }

    // Story Details Modal Methods
    showStoryDetails(story) {
        this.currentStoryForDetails = story;
        
        // Get assigned user info
        const assignedUser = story.assignedUserId ? 
            this.users.find(u => u.id === story.assignedUserId) : null;

        // Get epic info
        const epic = story.epicId ? 
            this.epics.find(e => e.id === story.epicId) : null;

        // Update modal title
        document.getElementById('storyDetailsTitle').textContent = `US${story.number}: ${story.title}`;

        // Populate story details
        const detailsContent = document.getElementById('storyDetailsContent');
        detailsContent.innerHTML = `
            <div class="story-detail-section">
                <label class="story-detail-label">Description</label>
                <div class="story-detail-value large">${this.escapeHtml(story.description || 'No description provided')}</div>
            </div>

            <div class="story-detail-section">
                <label class="story-detail-label">Current Status</label>
                <div class="story-detail-badges">
                    <span class="sprint-status-indicator sprint-status-${story.sprintStatus}">
                        ${this.getStatusIcon(story.sprintStatus)} ${story.sprintStatus.replace('-', ' ')}
                    </span>
                </div>
            </div>

            <div class="story-detail-section">
                <label class="story-detail-label">Priority & Story Points</label>
                <div class="story-detail-badges">
                    <span class="story-detail-badge priority-${story.priority}">${story.priority}</span>
                    <span class="story-detail-badge" style="background: rgba(102, 126, 234, 0.1); color: #667eea;">
                        ${story.storyPoints || 0} Story Points
                    </span>
                </div>
            </div>

            <div class="story-detail-section">
                <label class="story-detail-label">Assigned To</label>
                <div class="story-detail-assignee">
                    ${assignedUser ? `
                        <span class="story-detail-assignee-avatar">${assignedUser.avatar}</span>
                        <span class="story-detail-value">${assignedUser.name} (${assignedUser.role})</span>
                        <span class="story-detail-value" style="color: #9ca3af;">(${assignedUser.email})</span>
                    ` : '<span class="story-detail-value" style="color: #9ca3af;">Unassigned</span>'}
                </div>
            </div>

            ${epic ? `
                <div class="story-detail-section">
                    <label class="story-detail-label">Epic</label>
                    <div class="story-detail-epic">
                        <strong>E${epic.number}: ${this.escapeHtml(epic.title)}</strong>
                        <div style="margin-top: 0.5rem; font-size: 0.9rem; color: #6b7280;">
                            ${this.escapeHtml(epic.description || 'No description')}
                        </div>
                    </div>
                </div>
            ` : ''}

            <div class="story-detail-section">
                <label class="story-detail-label">Created</label>
                <div class="story-detail-value">${new Date(story.createdAt).toLocaleDateString()} at ${new Date(story.createdAt).toLocaleTimeString()}</div>
            </div>
        `;

        // Populate comments
        this.populateComments(story.id);
        
        // Show modal
        document.getElementById('storyDetailsModal').classList.add('show');
    }

    closeStoryDetailsModal() {
        document.getElementById('storyDetailsModal').classList.remove('show');
        this.currentStoryForDetails = null;
    }

    editStoryFromDetails() {
        if (this.currentStoryForDetails) {
            this.closeStoryDetailsModal();
            this.editItem(this.currentStoryForDetails.id, 'story');
        }
    }

    showEpicDetails(epic) {
        this.currentStoryForDetails = epic; // Reuse the same modal structure
        
        // Update modal title
        document.getElementById('storyDetailsTitle').textContent = `E${epic.number}: ${epic.title}`;

        // Populate epic details
        const detailsContent = document.getElementById('storyDetailsContent');
        detailsContent.innerHTML = `
            <div class="story-detail-section">
                <label class="story-detail-label">Description</label>
                <div class="story-detail-value large">${this.escapeHtml(epic.description || 'No description provided')}</div>
            </div>

            <div class="story-detail-section">
                <label class="story-detail-label">Priority</label>
                <div class="story-detail-badges">
                    <span class="story-detail-badge priority-${epic.priority}">${epic.priority}</span>
                </div>
            </div>

            <div class="story-detail-section">
                <label class="story-detail-label">User Stories in this Epic</label>
                <div class="story-detail-value">
                    ${this.getStoriesInEpic(epic.id).map(story => 
                        `<div style="margin: 0.5rem 0; padding: 0.5rem; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
                            <strong>US${story.number}:</strong> ${this.escapeHtml(story.title)}
                        </div>`
                    ).join('') || '<em>No user stories assigned to this epic yet.</em>'}
                </div>
            </div>

            <div class="story-detail-section">
                <label class="story-detail-label">Created</label>
                <div class="story-detail-value">${new Date(epic.createdAt).toLocaleDateString()} at ${new Date(epic.createdAt).toLocaleTimeString()}</div>
            </div>
        `;

        // Populate comments
        this.populateComments(epic.id);
        
        // Show modal
        document.getElementById('storyDetailsModal').classList.add('show');
    }

    getStoriesInEpic(epicId) {
        return this.stories.filter(story => story.epicId === epicId);
    }

    getStatusIcon(status) {
        const icons = {
            'todo': '📋',
            'in-progress': '▶️',
            'testing': '🐛',
            'testing-completed': '✅',
            'review': '👁️',
            'live': '🚀'
        };
        return icons[status] || '📋';
    }

    // Comments Methods
    populateComments(itemId) {
        // Populate author dropdown
        const authorSelect = document.getElementById('commentAuthor');
        authorSelect.innerHTML = '';
        
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.avatar} ${user.name} (${user.role})`;
            authorSelect.appendChild(option);
        });

        // Get comments for this item
        const comments = this.getCommentsForItem(itemId);
        
        // Update comments count
        const countElement = document.getElementById('commentsCount');
        countElement.textContent = `${comments.length} comment${comments.length !== 1 ? 's' : ''}`;

        // Render comments
        this.renderComments(comments);
    }

    getCommentsForItem(itemId) {
        const allComments = this.loadFromStorage('bratbox_comments') || [];
        return allComments.filter(comment => comment.itemId === itemId);
    }

    renderComments(comments) {
        const commentsList = document.getElementById('commentsList');
        
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="empty-comments">
                    <i class="fas fa-comments"></i>
                    <p>No comments yet. Be the first to add one!</p>
                </div>
            `;
            return;
        }

        commentsList.innerHTML = '';
        
        // Sort comments by date (newest first)
        const sortedComments = comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        sortedComments.forEach(comment => {
            const commentElement = this.createCommentElement(comment);
            commentsList.appendChild(commentElement);
        });
    }

    createCommentElement(comment) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment-item';
        commentDiv.dataset.commentId = comment.id;

        const author = this.users.find(u => u.id === comment.authorId);
        const authorName = author ? author.name : 'Unknown User';
        const authorAvatar = author ? author.avatar : '👤';

        commentDiv.innerHTML = `
            <div class="comment-header">
                <div class="comment-author">
                    <span class="comment-author-avatar">${authorAvatar}</span>
                    <span>${this.escapeHtml(authorName)}</span>
                </div>
                <div class="comment-date">${this.formatCommentDate(comment.createdAt)}</div>
            </div>
            <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            <div class="comment-actions">
                <button class="comment-action-btn delete" onclick="app.deleteComment('${comment.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;

        return commentDiv;
    }

    addComment() {
        if (!this.currentStoryForDetails) return;

        const authorId = document.getElementById('commentAuthor').value;
        const content = document.getElementById('commentText').value.trim();

        if (!authorId || !content) {
            this.showNotification('Please select an author and enter a comment.', 'error');
            return;
        }

        const comment = {
            id: this.generateId(),
            itemId: this.currentStoryForDetails.id,
            authorId: authorId,
            content: content,
            createdAt: new Date().toISOString()
        };

        // Save comment
        const allComments = this.loadFromStorage('bratbox_comments') || [];
        allComments.push(comment);
        this.saveToStorage('bratbox_comments', allComments);

        // Clear form
        document.getElementById('commentText').value = '';

        // Refresh comments display
        this.populateComments(this.currentStoryForDetails.id);

        this.showNotification('Comment added successfully!');
    }

    deleteComment(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        const allComments = this.loadFromStorage('bratbox_comments') || [];
        const updatedComments = allComments.filter(comment => comment.id !== commentId);
        this.saveToStorage('bratbox_comments', updatedComments);

        // Refresh comments display
        if (this.currentStoryForDetails) {
            this.populateComments(this.currentStoryForDetails.id);
        }

        this.showNotification('Comment deleted successfully!');
    }

    formatCommentDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 1) {
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 24) {
            const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
            return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
        } else if (diffInHours < 168) { // 7 days
            const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
        }
    }

    // Backlog Selection Modal Methods
    openBacklogSelectionModal(availableStories) {
        this.availableStories = availableStories;
        this.selectedStories = new Set();
        this.filteredStories = [...availableStories];
        
        // Clear search input
        document.getElementById('backlogSearchInput').value = '';
        
        // Render stories
        this.renderBacklogStories();
        
        // Update selection count
        this.updateSelectionCount();
        
        // Show modal
        document.getElementById('backlogSelectionModal').classList.add('show');
    }

    closeBacklogSelectionModal() {
        document.getElementById('backlogSelectionModal').classList.remove('show');
        this.availableStories = null;
        this.selectedStories = null;
        this.filteredStories = null;
    }

    renderBacklogStories() {
        const storiesList = document.getElementById('backlogStoriesList');
        
        if (this.filteredStories.length === 0) {
            storiesList.innerHTML = `
                <div class="empty-backlog-stories">
                    <i class="fas fa-search"></i>
                    <h3>No stories found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }

        storiesList.innerHTML = '';
        
        this.filteredStories.forEach(story => {
            const storyElement = this.createBacklogStoryElement(story);
            storiesList.appendChild(storyElement);
        });
    }

    createBacklogStoryElement(story) {
        const storyDiv = document.createElement('div');
        storyDiv.className = 'backlog-story-item';
        storyDiv.dataset.storyId = story.id;

        // Get assigned user info
        const assignedUser = story.assignedUserId ? 
            this.users.find(u => u.id === story.assignedUserId) : null;

        // Get epic info
        const epic = story.epicId ? 
            this.epics.find(e => e.id === story.epicId) : null;

        storyDiv.innerHTML = `
            <input type="checkbox" class="backlog-story-checkbox" data-story-id="${story.id}">
            <div class="backlog-story-content">
                <div class="backlog-story-header">
                    <div class="backlog-story-title">
                        <span class="backlog-story-number">US${story.number}</span>
                        ${this.escapeHtml(story.title)}
                    </div>
                </div>
                <div class="backlog-story-description">
                    ${this.escapeHtml(story.description || 'No description')}
                </div>
                <div class="backlog-story-meta">
                    ${assignedUser ? `
                        <div class="backlog-story-assignee">
                            ${assignedUser.avatar} ${assignedUser.name} (${assignedUser.role})
                        </div>
                    ` : ''}
                    ${epic ? `
                        <div class="backlog-story-epic">
                            📋 E${epic.number}: ${this.escapeHtml(epic.title)}
                        </div>
                    ` : ''}
                    <div class="backlog-story-points">
                        ${story.storyPoints || 0} pts
                    </div>
                    <div class="backlog-story-priority priority-${story.priority}">
                        ${story.priority}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const checkbox = storyDiv.querySelector('.backlog-story-checkbox');
        checkbox.addEventListener('change', (e) => {
            this.toggleStorySelection(story.id, e.target.checked);
        });

        // Click on story item to toggle selection
        storyDiv.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
                this.toggleStorySelection(story.id, checkbox.checked);
            }
        });

        return storyDiv;
    }

    toggleStorySelection(storyId, selected) {
        if (selected) {
            this.selectedStories.add(storyId);
        } else {
            this.selectedStories.delete(storyId);
        }
        
        this.updateSelectionCount();
        this.updateStoryItemSelection(storyId, selected);
    }

    updateStoryItemSelection(storyId, selected) {
        const storyItem = document.querySelector(`[data-story-id="${storyId}"]`);
        if (storyItem) {
            if (selected) {
                storyItem.classList.add('selected');
            } else {
                storyItem.classList.remove('selected');
            }
        }
    }

    updateSelectionCount() {
        const count = this.selectedStories.size;
        const countElement = document.getElementById('selectionCount');
        const addButton = document.getElementById('addSelectedStoriesBtn');
        
        countElement.textContent = `${count} selected`;
        addButton.disabled = count === 0;
        
        if (count > 0) {
            addButton.textContent = `Add ${count} Selected Stories`;
        } else {
            addButton.innerHTML = '<i class="fas fa-plus"></i> Add Selected Stories';
        }
    }

    selectAllStories() {
        this.filteredStories.forEach(story => {
            this.selectedStories.add(story.id);
            const checkbox = document.querySelector(`[data-story-id="${story.id}"] .backlog-story-checkbox`);
            if (checkbox) {
                checkbox.checked = true;
                this.updateStoryItemSelection(story.id, true);
            }
        });
        this.updateSelectionCount();
    }

    selectNoneStories() {
        this.selectedStories.clear();
        this.filteredStories.forEach(story => {
            const checkbox = document.querySelector(`[data-story-id="${story.id}"] .backlog-story-checkbox`);
            if (checkbox) {
                checkbox.checked = false;
                this.updateStoryItemSelection(story.id, false);
            }
        });
        this.updateSelectionCount();
    }

    filterStories(searchTerm) {
        if (!searchTerm.trim()) {
            this.filteredStories = [...this.availableStories];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredStories = this.availableStories.filter(story => {
                // Search in story title
                if (story.title.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Search in story description
                if (story.description && story.description.toLowerCase().includes(term)) {
                    return true;
                }
                
                // Search in epic name if story belongs to an epic
                if (story.epicId) {
                    const epic = this.epics.find(e => e.id === story.epicId);
                    if (epic && epic.title.toLowerCase().includes(term)) {
                        return true;
                    }
                }
                
                return false;
            });
        }
        
        // Clear selections when filtering
        this.selectedStories.clear();
        this.renderBacklogStories();
        this.updateSelectionCount();
    }

    clearSearch() {
        document.getElementById('backlogSearchInput').value = '';
        this.filterStories('');
    }

    addSelectedStories() {
        if (this.selectedStories.size === 0) {
            this.showNotification('Please select at least one story to add.', 'error');
            return;
        }

        const storiesToAdd = this.availableStories
            .filter(story => this.selectedStories.has(story.id))
            .map(story => ({
                ...story,
                sprintStatus: 'todo'
            }));

        this.sprintStories.push(...storiesToAdd);
        this.saveToStorage('bratbox_sprint_stories', this.sprintStories);
        this.renderSprintBoard();
        
        this.closeBacklogSelectionModal();
        this.showNotification(`${storiesToAdd.length} stories added to sprint successfully!`);
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BratBoxApp();
});

// Sample data removed - using shared storage for team collaboration
