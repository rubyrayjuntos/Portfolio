// Admin.js - Content management functionality for type-specific structure

console.log('=== ADMIN.JS LOADED ===');
console.log('Admin.js file is being executed');

class PortfolioAdmin {
    constructor() {
        this.projectTypes = {};
        this.currentProjectType = null;
        this.currentProject = null;
        this.init();
    }

    async init() {
        console.log('Admin: Initializing...');
        
        // Add a small delay to ensure session is established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check authentication first
        const isAuthenticated = await this.checkAuth();
        console.log('Admin: Authentication check result:', isAuthenticated);
        
        if (!isAuthenticated) {
            console.log('Admin: Not authenticated, redirecting to login');
            window.location.href = '/admin-login.html';
            return;
        }
        
        console.log('Admin: Authentication successful, loading admin panel');
        
        await this.loadProjectTypes();
        this.setupEventListeners();
        this.renderProjectTypeList();
        this.loadJsonEditor();
        this.setupAuthUI();
        this.addDebugButton(); // Add debug button for troubleshooting
        
        console.log('Admin: Initialization complete');
    }

    async checkAuth() {
        try {
            console.log('Admin: Checking authentication...');
            
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            console.log('Admin: Auth status response:', data);
            
            return data.authenticated;
        } catch (error) {
            console.error('Admin: Auth check failed:', error);
            return false;
        }
    }

    setupAuthUI() {
        // Add logout button to admin header
        const adminHeader = document.querySelector('.admin-header');
        if (adminHeader) {
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'btn btn-secondary';
            logoutBtn.textContent = 'Logout';
            logoutBtn.onclick = () => this.logout();
            adminHeader.appendChild(logoutBtn);
        }
    }

    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                window.location.href = '/admin-login.html';
            } else {
                console.error('Logout failed');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    async loadProjectTypes() {
        try {
            const response = await fetch('/data/projects.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.projectTypes = data.projectTypes || {};
            console.log('Admin: Loaded project types:', Object.keys(this.projectTypes));
        } catch (error) {
            console.error('Error loading project types:', error);
            this.showStatus('Error loading project types', 'error');
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Form submission
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProject();
            });
        }

        // Tag inputs
        this.setupTagInput('tag-field', 'tag-input');
        this.setupTagInput('tech-field', 'tech-input');

        // Image upload
        this.setupImageUpload();

        // JSON editor
        const jsonEditor = document.getElementById('json-editor');
        if (jsonEditor) {
            jsonEditor.addEventListener('input', () => {
                this.validateJson();
            });
        }
    }

    setupTagInput(inputId, containerId) {
        const input = document.getElementById(inputId);
        const container = document.getElementById(containerId);
        
        if (!input || !container) return;

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = input.value.trim();
                if (value) {
                    this.addTag(container, value);
                    input.value = '';
                }
            }
        });
    }

    addTag(container, value) {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `
            ${value}
            <button class="tag-remove" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.insertBefore(tag, container.querySelector('input'));
    }

    setupImageUpload() {
        const upload = document.getElementById('image-upload');
        const fileInput = document.getElementById('image-file');
        
        if (!upload || !fileInput) return;

        // Drag and drop
        upload.addEventListener('dragover', (e) => {
            e.preventDefault();
            upload.classList.add('dragover');
        });

        upload.addEventListener('dragleave', () => {
            upload.classList.remove('dragover');
        });

        upload.addEventListener('drop', (e) => {
            e.preventDefault();
            upload.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleImageFiles(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleImageFiles(files);
        });
    }

    handleImageFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showStatus('No valid image files selected', 'warning');
            return;
        }

        imageFiles.forEach(async (file) => {
            try {
                // Show loading state
                const loadingItem = this.addImagePreview('', file.name, true);
                
                // Optimize and upload image
                const optimizedImage = await imageOptimizer.uploadImage(file);
                
                // Remove loading item and add optimized image
                if (loadingItem && loadingItem.parentNode) {
                    loadingItem.remove();
                }
                
                const imageItem = this.addImagePreview(optimizedImage.optimized.src, file.name, false, optimizedImage);
                
                // Ensure the image preview container is visible
                const preview = document.getElementById('image-preview');
                if (preview) {
                    preview.style.display = 'grid';
                }
                
                this.showStatus(`Image "${file.name}" uploaded successfully`, 'success');
                
                // Trigger a custom event to notify other components
                window.dispatchEvent(new CustomEvent('imageUploaded', {
                    detail: { imageData: optimizedImage, fileName: file.name }
                }));
                
            } catch (error) {
                console.error('Image upload error:', error);
                
                // Remove loading item if it exists
                const loadingItems = document.querySelectorAll('.image-loading');
                loadingItems.forEach(item => {
                    if (item.textContent.includes(file.name)) {
                        item.parentElement.remove();
                    }
                });
                
                this.showStatus(`Failed to upload "${file.name}": ${error.message}`, 'error');
            }
        });
    }

    addImagePreview(src, name, isLoading = false, imageData = null) {
        const preview = document.getElementById('image-preview');
        if (!preview) {
            console.error('Image preview container not found');
            return null;
        }
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        if (isLoading) {
            imageItem.innerHTML = `
                <div class="image-loading">
                    <div class="loading-spinner"></div>
                    <p>Uploading ${name}...</p>
                </div>
            `;
        } else {
            // Use optimized image URL if available, otherwise use provided src
            const imageUrl = imageData?.optimized?.src || src;
            const originalSize = imageData?.original?.size || 0;
            const optimizedSize = imageData?.optimized?.size || originalSize;
            const dimensions = imageData?.optimized?.dimensions || { width: 'N/A', height: 'N/A' };
            
            // Get existing metadata if available
            const existingTitle = imageData?.title || name;
            const existingDescription = imageData?.description || 'Image description';
            
            imageItem.innerHTML = `
                <img src="${imageUrl}" alt="${existingTitle}" loading="lazy">
                <div class="image-overlay">
                    <div class="image-info">
                        <span>${(optimizedSize / 1024).toFixed(1)}KB</span>
                        <span>${dimensions.width}×${dimensions.height}</span>
                    </div>
                    <div class="image-metadata">
                        <input type="text" class="image-title" placeholder="Image title" value="${existingTitle}" 
                               onchange="this.parentElement.parentElement.parentElement.dataset.imageTitle = this.value">
                        <textarea class="image-description" placeholder="Image description" 
                                  onchange="this.parentElement.parentElement.parentElement.dataset.imageDescription = this.value">${existingDescription}</textarea>
                    </div>
                    <button class="image-remove">&times;</button>
                </div>
            `;
            
            // Store image data for form submission
            if (imageData) {
                imageItem.dataset.imageData = JSON.stringify(imageData);
                // Also store a reference to the image item for easier access
                imageItem.dataset.fileName = name;
                imageItem.dataset.imageTitle = existingTitle;
                imageItem.dataset.imageDescription = existingDescription;
            }
        }
        
        preview.appendChild(imageItem);
        
        // Update remove button functionality
        this.updateImageRemoveButtons();
        
        // Log for debugging
        if (!isLoading && imageData) {
            console.log('Image preview added:', {
                fileName: name,
                imageUrl: imageUrl,
                imageData: imageData
            });
        }
        
        return imageItem;
    }

    renderProjectTypeList() {
        const list = document.getElementById('project-list');
        if (!list) return;

        const types = Object.entries(this.projectTypes);
        
        list.innerHTML = types.map(([typeKey, typeData]) => `
            <div class="project-type-item" onclick="admin.showProjectTypeProjects('${typeKey}')">
                <div class="type-header">
                    <div class="type-icon">${typeData.icon}</div>
                    <h3>${typeData.title}</h3>
                </div>
                <p>${typeData.description}</p>
                <div class="type-count">
                    ${this.getTypeCount(typeKey, typeData)} ${typeKey === 'blog' ? 'posts' : 'projects'}
                </div>
                <div class="type-actions">
                    <button class="btn btn-secondary" onclick="event.stopPropagation(); admin.editProjectType('${typeKey}')">
                        Edit Type
                    </button>
                    <button class="btn btn-primary" onclick="event.stopPropagation(); admin.createNewProject('${typeKey}')">
                        Add ${typeKey === 'blog' ? 'Post' : 'Project'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    getTypeCount(typeKey, typeData) {
        if (typeKey === 'blog') {
            return typeData.posts ? typeData.posts.length : 0;
        } else {
            return typeData.projects ? typeData.projects.length : 0;
        }
    }

    showProjectTypeProjects(typeKey) {
        const container = document.getElementById('projects-section');
        if (!container) return;

        const typeData = this.projectTypes[typeKey];
        if (!typeData) return;

        this.currentProjectType = typeKey;

        let items = [];
        if (typeKey === 'blog') {
            items = typeData.posts || [];
        } else {
            items = typeData.projects || [];
        }

        container.innerHTML = `
            <div class="section-header">
                <button class="btn btn-secondary" onclick="admin.renderProjectTypeList()">
                    ← Back to Project Types
                </button>
                <h2>${typeData.title}</h2>
                <p>${typeData.description}</p>
            </div>
            <div class="project-list">
                ${items.map(item => `
                    <div class="project-item" onclick="admin.editProject('${typeKey}', '${item.id}')">
                        <h3>${item.title}</h3>
                        <p>${item.description.substring(0, 100)}...</p>
                        ${this.getProjectMetaDisplay(typeKey, item)}
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-primary" onclick="admin.createNewProject('${typeKey}')" style="margin-top: 1rem;">
                + Add ${typeKey === 'blog' ? 'Blog Post' : 'Project'}
            </button>
        `;
    }

    getProjectMetaDisplay(typeKey, item) {
        switch (typeKey) {
            case 'gallery':
                return `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="tag">${item.tags ? item.tags[0] : 'Digital Art'}</span>
                        <span class="tag">${item.date ? new Date(item.date).getFullYear() : 'N/A'}</span>
                        ${item.featured ? '<span class="tag">Featured</span>' : ''}
                    </div>
                `;
            
            case 'blog':
                return `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="tag">${item.category || 'General'}</span>
                        <span class="tag">${item.readTime || '5 min'}</span>
                        <span class="tag">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                        ${item.featured ? '<span class="tag">Featured</span>' : ''}
                    </div>
                `;
            
            case 'demo':
                return `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="tag">${item.technologies ? item.technologies[0] : 'Web'}</span>
                        <span class="tag">${item.date ? new Date(item.date).getFullYear() : 'N/A'}</span>
                        ${item.featured ? '<span class="tag">Featured</span>' : ''}
                    </div>
                `;
            
            case 'stories':
                return `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="tag">${item.genre || 'Fiction'}</span>
                        <span class="tag">${item.wordCount || 0} words</span>
                        <span class="tag">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                        ${item.featured ? '<span class="tag">Featured</span>' : ''}
                    </div>
                `;
            
            case 'brand':
                return `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="tag">${item.client || 'Client'}</span>
                        <span class="tag">${item.date ? new Date(item.date).getFullYear() : 'N/A'}</span>
                        ${item.featured ? '<span class="tag">Featured</span>' : ''}
                    </div>
                `;
            
            case 'github':
                return `
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
                        <span class="tag">⭐ ${item.stars || 0}</span>
                        <span class="tag">🍴 ${item.forks || 0}</span>
                        <span class="tag">${item.date ? new Date(item.date).getFullYear() : 'N/A'}</span>
                        ${item.featured ? '<span class="tag">Featured</span>' : ''}
                    </div>
                `;
            
            default:
                return `<div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-light);">Date: ${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</div>`;
        }
    }

    editProjectType(typeKey) {
        const typeData = this.projectTypes[typeKey];
        if (!typeData) return;

        // Show form to edit project type metadata
        const container = document.getElementById('editor-section');
        if (!container) return;

        container.innerHTML = `
            <h2>Edit Project Type: ${typeData.title}</h2>
            <form id="project-type-form" class="project-form">
                <div class="form-row">
                    <div class="form-group">
                        <label for="type-title">Title</label>
                        <input type="text" id="type-title" value="${typeData.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="type-icon">Icon</label>
                        <input type="text" id="type-icon" value="${typeData.icon}" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="type-description">Description</label>
                    <textarea id="type-description" required>${typeData.description}</textarea>
                </div>
                <div class="action-buttons">
                    <button type="submit" class="btn btn-save">Save Type</button>
                    <button type="button" class="btn btn-cancel" onclick="admin.renderProjectTypeList()">Cancel</button>
                </div>
            </form>
        `;

        // Add form submission handler
        const form = document.getElementById('project-type-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProjectType(typeKey);
        });
    }

    async saveProjectType(typeKey) {
        const title = document.getElementById('type-title').value;
        const icon = document.getElementById('type-icon').value;
        const description = document.getElementById('type-description').value;

        this.projectTypes[typeKey] = {
            ...this.projectTypes[typeKey],
            title,
            icon,
            description
        };

        await this.saveProjectTypes();
        this.renderProjectTypeList();
        this.showStatus('Project type saved successfully');
    }

    editProject(typeKey, projectId) {
        console.log('Admin: editProject called with:', { typeKey, projectId });
        
        const typeData = this.projectTypes[typeKey];
        if (!typeData) {
            console.log('Admin: No type data found for:', typeKey);
            return;
        }

        let item = null;
        if (typeKey === 'blog') {
            item = typeData.posts?.find(post => post.id === projectId);
        } else {
            item = typeData.projects?.find(project => project.id === projectId);
        }

        if (!item) {
            console.log('Admin: No item found with ID:', projectId);
            return;
        }

        console.log('Admin: Found item to edit:', item);

        this.currentProjectType = typeKey;
        this.currentProject = item;

        // Show the editor section
        this.showSection('editor');
        
        this.populateProjectForm(typeKey, item);
    }

    populateProjectForm(typeKey, item) {
        console.log('Admin: populateProjectForm called with:', { typeKey, item });
        
        const container = document.getElementById('editor-section');
        if (!container) {
            console.log('Admin: editor-section container not found');
            return;
        }

        console.log('Admin: Generating form HTML...');
        // Show the appropriate form based on project type
        container.innerHTML = this.getProjectFormHTML(typeKey, item);
        
        console.log('Admin: Populating form fields...');
        // Populate form fields
        this.populateFormFields(typeKey, item);
        
        console.log('Admin: Setting up form submission...');
        // Setup form submission
        const form = document.getElementById('project-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProject();
            });
            console.log('Admin: Form submission handler added');
        } else {
            console.log('Admin: project-form not found');
        }
        
        // Setup image upload functionality
        console.log('Admin: Setting up image upload...');
        this.setupImageUpload();
        
        // Setup tag inputs
        this.setupTagInput('tag-field', 'tag-input');
        if (typeKey === 'demo') {
            this.setupTagInput('tech-field', 'tech-input');
        }
    }

    getProjectFormHTML(typeKey, item) {
        const isNew = !item;
        const title = isNew ? `Add New ${typeKey === 'blog' ? 'Blog Post' : 'Project'}` : `Edit ${typeKey === 'blog' ? 'Blog Post' : 'Project'}`;

        switch (typeKey) {
            case 'gallery':
                return `
                    <h2>${title}</h2>
                    <form id="project-form" class="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-id">Project ID</label>
                                <input type="text" id="project-id" value="${item?.id || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-title">Title</label>
                                <input type="text" id="project-title" value="${item?.title || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" required>${item?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="project-content">Content</label>
                            <textarea id="project-content" required rows="5">${item?.content || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-date">Date</label>
                                <input type="date" id="project-date" value="${item?.date || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="project-featured" ${item?.featured ? 'checked' : ''}>
                                    Featured Project
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <div class="tag-input" id="tag-input">
                                <input type="text" placeholder="Add a tag and press Enter" id="tag-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Images</label>
                            <div class="image-upload" id="image-upload" onclick="document.getElementById('image-file').click()">
                                <p>Click to upload images or drag and drop</p>
                                <input type="file" id="image-file" multiple accept="image/*" style="display: none;">
                            </div>
                            <div class="image-preview" id="image-preview"></div>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-save">Save Project</button>
                            <button type="button" class="btn btn-cancel" onclick="admin.showProjectTypeProjects('${typeKey}')">Cancel</button>
                            ${!isNew ? `<button type="button" class="btn btn-delete" onclick="admin.deleteProject('${typeKey}', '${item.id}')">Delete Project</button>` : ''}
                        </div>
                    </form>
                `;
            
            case 'blog':
                return `
                    <h2>${title}</h2>
                    <form id="project-form" class="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-id">Post ID</label>
                                <input type="text" id="project-id" value="${item?.id || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-title">Title</label>
                                <input type="text" id="project-title" value="${item?.title || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" required>${item?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="project-content">Content</label>
                            <textarea id="project-content" required rows="10">${item?.content || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-author">Author</label>
                                <input type="text" id="project-author" value="${item?.author || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-date">Date</label>
                                <input type="date" id="project-date" value="${item?.date || ''}" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-category">Category</label>
                                <input type="text" id="project-category" value="${item?.category || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-read-time">Read Time</label>
                                <input type="text" id="project-read-time" value="${item?.readTime || ''}" placeholder="5 min read" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <div class="tag-input" id="tag-input">
                                <input type="text" placeholder="Add a tag and press Enter" id="tag-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-cover-image">Cover Image URL</label>
                            <input type="url" id="project-cover-image" value="${item?.coverImage || ''}" placeholder="https://example.com/image.jpg">
                        </div>
                        <div class="form-group">
                            <label for="project-slug">Slug</label>
                            <input type="text" id="project-slug" value="${item?.slug || ''}" placeholder="post-url-slug">
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="project-featured" ${item?.featured ? 'checked' : ''}>
                                Featured Post
                            </label>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-save">Save Blog Post</button>
                            <button type="button" class="btn btn-cancel" onclick="admin.showProjectTypeProjects('${typeKey}')">Cancel</button>
                            ${!isNew ? `<button type="button" class="btn btn-delete" onclick="admin.deleteProject('${typeKey}', '${item.id}')">Delete Post</button>` : ''}
                        </div>
                    </form>
                `;
            
            case 'demo':
                return `
                    <h2>${title}</h2>
                    <form id="project-form" class="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-id">Project ID</label>
                                <input type="text" id="project-id" value="${item?.id || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-title">Title</label>
                                <input type="text" id="project-title" value="${item?.title || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" required>${item?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="project-content">Content</label>
                            <textarea id="project-content" required rows="5">${item?.content || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-date">Date</label>
                                <input type="date" id="project-date" value="${item?.date || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="project-featured" ${item?.featured ? 'checked' : ''}>
                                    Featured Project
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Technologies</label>
                            <div class="tag-input" id="tech-input">
                                <input type="text" placeholder="Add a technology and press Enter" id="tech-field">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-live-url">Live URL</label>
                                <input type="url" id="project-live-url" value="${item?.liveUrl || ''}" placeholder="https://demo.example.com">
                            </div>
                            <div class="form-group">
                                <label for="project-github-url">GitHub URL</label>
                                <input type="url" id="project-github-url" value="${item?.githubUrl || ''}" placeholder="https://github.com/example/project">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <div class="tag-input" id="tag-input">
                                <input type="text" placeholder="Add a tag and press Enter" id="tag-field">
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-save">Save Project</button>
                            <button type="button" class="btn btn-cancel" onclick="admin.showProjectTypeProjects('${typeKey}')">Cancel</button>
                            ${!isNew ? `<button type="button" class="btn btn-delete" onclick="admin.deleteProject('${typeKey}', '${item.id}')">Delete Project</button>` : ''}
                        </div>
                    </form>
                `;

            case 'stories':
                return `
                    <h2>${title}</h2>
                    <form id="project-form" class="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-id">Story ID</label>
                                <input type="text" id="project-id" value="${item?.id || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-title">Title</label>
                                <input type="text" id="project-title" value="${item?.title || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" required>${item?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="project-content">Content</label>
                            <textarea id="project-content" required rows="10">${item?.content || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-genre">Genre</label>
                                <input type="text" id="project-genre" value="${item?.genre || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-word-count">Word Count</label>
                                <input type="number" id="project-word-count" value="${item?.wordCount || 0}" min="0" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-date">Date</label>
                                <input type="date" id="project-date" value="${item?.date || ''}" required>
                            </div>
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="project-featured" ${item?.featured ? 'checked' : ''}>
                                    Featured Story
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <div class="tag-input" id="tag-input">
                                <input type="text" placeholder="Add a tag and press Enter" id="tag-field">
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-save">Save Story</button>
                            <button type="button" class="btn btn-cancel" onclick="admin.showProjectTypeProjects('${typeKey}')">Cancel</button>
                            ${!isNew ? `<button type="button" class="btn btn-delete" onclick="admin.deleteProject('${typeKey}', '${item.id}')">Delete Story</button>` : ''}
                        </div>
                    </form>
                `;

            case 'brand':
                return `
                    <h2>${title}</h2>
                    <form id="project-form" class="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-id">Project ID</label>
                                <input type="text" id="project-id" value="${item?.id || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-title">Title</label>
                                <input type="text" id="project-title" value="${item?.title || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" required>${item?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="project-content">Content</label>
                            <textarea id="project-content" required rows="5">${item?.content || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-client">Client</label>
                                <input type="text" id="project-client" value="${item?.client || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-date">Date</label>
                                <input type="date" id="project-date" value="${item?.date || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Services</label>
                            <div class="tag-input" id="tech-input">
                                <input type="text" placeholder="Add a service and press Enter" id="tech-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <div class="tag-input" id="tag-input">
                                <input type="text" placeholder="Add a tag and press Enter" id="tag-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="project-featured" ${item?.featured ? 'checked' : ''}>
                                Featured Project
                            </label>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-save">Save Project</button>
                            <button type="button" class="btn btn-cancel" onclick="admin.showProjectTypeProjects('${typeKey}')">Cancel</button>
                            ${!isNew ? `<button type="button" class="btn btn-delete" onclick="admin.deleteProject('${typeKey}', '${item.id}')">Delete Project</button>` : ''}
                        </div>
                    </form>
                `;

            case 'github':
                return `
                    <h2>${title}</h2>
                    <form id="project-form" class="project-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-id">Project ID</label>
                                <input type="text" id="project-id" value="${item?.id || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-title">Title</label>
                                <input type="text" id="project-title" value="${item?.title || ''}" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="project-description">Description</label>
                            <textarea id="project-description" required>${item?.description || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label for="project-content">Content</label>
                            <textarea id="project-content" required rows="5">${item?.content || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-date">Date</label>
                                <input type="date" id="project-date" value="${item?.date || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="project-github-url">GitHub URL</label>
                                <input type="url" id="project-github-url" value="${item?.githubUrl || ''}" placeholder="https://github.com/example/project" required>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="project-stars">Stars</label>
                                <input type="number" id="project-stars" value="${item?.stars || 0}" min="0" required>
                            </div>
                            <div class="form-group">
                                <label for="project-forks">Forks</label>
                                <input type="number" id="project-forks" value="${item?.forks || 0}" min="0" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Technologies</label>
                            <div class="tag-input" id="tech-input">
                                <input type="text" placeholder="Add a technology and press Enter" id="tech-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Tags</label>
                            <div class="tag-input" id="tag-input">
                                <input type="text" placeholder="Add a tag and press Enter" id="tag-field">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="project-featured" ${item?.featured ? 'checked' : ''}>
                                Featured Project
                            </label>
                        </div>
                        <div class="action-buttons">
                            <button type="submit" class="btn btn-save">Save Project</button>
                            <button type="button" class="btn btn-cancel" onclick="admin.showProjectTypeProjects('${typeKey}')">Cancel</button>
                            ${!isNew ? `<button type="button" class="btn btn-delete" onclick="admin.deleteProject('${typeKey}', '${item.id}')">Delete Project</button>` : ''}
                        </div>
                    </form>
                `;
            
            default:
                return `
                    <h2>${title}</h2>
                    <p>Form for ${typeKey} project type not yet implemented.</p>
                    <button class="btn btn-secondary" onclick="admin.showProjectTypeProjects('${typeKey}')">Back to List</button>
                `;
        }
    }

    populateFormFields(typeKey, item) {
        if (!item) return;

        // Populate tags
        if (item.tags) {
            item.tags.forEach(tag => {
                this.addTag(document.getElementById('tag-input'), tag);
            });
        }

        // Populate technologies/services
        if (item.technologies && document.getElementById('tech-input')) {
            item.technologies.forEach(tech => {
                this.addTag(document.getElementById('tech-input'), tech);
            });
        }

        if (item.services && document.getElementById('tech-input')) {
            item.services.forEach(service => {
                this.addTag(document.getElementById('tech-input'), service);
            });
        }

        // Populate images for gallery projects
        if (typeKey === 'gallery' && item.images) {
            this.populateExistingImages(item.images);
        }
    }

    createNewProject(typeKey) {
        this.currentProjectType = typeKey;
        this.currentProject = null;
        
        // Show the editor section
        this.showSection('editor');
        
        this.populateProjectForm(typeKey, null);
    }

    async saveProject() {
        const typeKey = this.currentProjectType;
        if (!typeKey) return;

        try {
            const formData = this.getFormData(typeKey);
            
            if (typeKey === 'blog') {
                await this.saveBlogPostToType(formData);
            } else {
                await this.saveProjectToType(typeKey, formData);
            }

            this.showProjectTypeProjects(typeKey);
            this.showStatus(`${typeKey === 'blog' ? 'Blog post' : 'Project'} saved successfully`);
        } catch (error) {
            console.error('Error saving project:', error);
            this.showStatus('Error saving project', 'error');
        }
    }

    getFormData(typeKey) {
        const formData = {
            id: document.getElementById('project-id').value,
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description')?.value || '',
            content: document.getElementById('project-content')?.value || '',
            date: document.getElementById('project-date')?.value || new Date().toISOString().split('T')[0],
            featured: document.getElementById('project-featured')?.checked || false,
            tags: this.getTagsFromContainer('tag-input')
        };

        switch (typeKey) {
            case 'gallery':
                formData.images = this.getImagesFromPreview();
                break;
            
            case 'blog':
                formData.author = document.getElementById('project-author')?.value || '';
                formData.category = document.getElementById('project-category')?.value || '';
                formData.readTime = document.getElementById('project-read-time')?.value || '';
                formData.coverImage = document.getElementById('project-cover-image')?.value || '';
                formData.slug = document.getElementById('project-slug')?.value || formData.id;
                break;

            case 'demo':
                formData.technologies = this.getTagsFromContainer('tech-input');
                formData.liveUrl = document.getElementById('project-live-url')?.value || '';
                formData.githubUrl = document.getElementById('project-github-url')?.value || '';
                break;

            case 'stories':
                formData.genre = document.getElementById('project-genre')?.value || '';
                formData.wordCount = parseInt(document.getElementById('project-word-count')?.value) || 0;
                break;

            case 'brand':
                formData.client = document.getElementById('project-client')?.value || '';
                formData.services = this.getTagsFromContainer('tech-input');
                break;

            case 'github':
                formData.technologies = this.getTagsFromContainer('tech-input');
                formData.githubUrl = document.getElementById('project-github-url')?.value || '';
                formData.stars = parseInt(document.getElementById('project-stars')?.value) || 0;
                formData.forks = parseInt(document.getElementById('project-forks')?.value) || 0;
                break;
        }

        return formData;
    }

    getTagsFromContainer(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return [];
        
        return Array.from(container.querySelectorAll('.tag'))
            .map(tag => tag.textContent.trim().replace('×', '').trim())
            .filter(tag => tag);
    }

    getImagesFromPreview() {
        const preview = document.getElementById('image-preview');
        if (!preview) {
            console.warn('Image preview container not found');
            return [];
        }
        
        const imageItems = preview.querySelectorAll('.image-item');
        console.log(`Found ${imageItems.length} image items in preview`);
        
        return Array.from(imageItems)
            .map(item => {
                const img = item.querySelector('img');
                const imageData = item.dataset.imageData ? JSON.parse(item.dataset.imageData) : null;
                
                if (!img) {
                    console.warn('Image element not found in item:', item);
                    return null;
                }
                
                // Use server URL if available, otherwise fall back to img src
                const imageUrl = imageData?.optimized?.src || img.src;
                const dimensions = imageData?.optimized?.dimensions || { width: 'N/A', height: 'N/A' };
                
                // Get custom metadata from the image item
                const customTitle = item.dataset.imageTitle || item.querySelector('.image-title')?.value || img.alt || 'Image';
                const customDescription = item.dataset.imageDescription || item.querySelector('.image-description')?.value || 'Image description';
                
                const imageInfo = {
                    src: imageUrl,
                    fullSrc: imageUrl,
                    title: customTitle,
                    description: customDescription,
                    dimensions: `${dimensions.width}x${dimensions.height}`,
                    medium: 'Digital',
                    // Include server info for reference
                    serverInfo: imageData?.serverInfo || null
                };
                
                console.log('Processing image:', imageInfo);
                return imageInfo;
            })
            .filter(item => item !== null); // Remove any null items
    }

    async saveProjectToType(typeKey, formData) {
        if (!this.projectTypes[typeKey].projects) {
            this.projectTypes[typeKey].projects = [];
        }

        const existingIndex = this.projectTypes[typeKey].projects.findIndex(p => p.id === formData.id);
        
        if (existingIndex >= 0) {
            this.projectTypes[typeKey].projects[existingIndex] = formData;
        } else {
            this.projectTypes[typeKey].projects.push(formData);
        }

        await this.saveProjectTypes();
    }

    async saveBlogPostToType(formData) {
        if (!this.projectTypes.blog.posts) {
            this.projectTypes.blog.posts = [];
        }

        const existingIndex = this.projectTypes.blog.posts.findIndex(p => p.id === formData.id);
        
        if (existingIndex >= 0) {
            this.projectTypes.blog.posts[existingIndex] = formData;
        } else {
            this.projectTypes.blog.posts.push(formData);
        }

        await this.saveProjectTypes();
    }

    async deleteProject(typeKey, projectId) {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            if (typeKey === 'blog') {
                this.projectTypes.blog.posts = this.projectTypes.blog.posts.filter(p => p.id !== projectId);
            } else {
                this.projectTypes[typeKey].projects = this.projectTypes[typeKey].projects.filter(p => p.id !== projectId);
            }

            await this.saveProjectTypes();
            this.showProjectTypeProjects(typeKey);
            this.showStatus('Project deleted successfully');
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showStatus('Error deleting project', 'error');
        }
    }

    async saveProjectTypes() {
        try {
            const response = await fetch('/data/projects.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ projectTypes: this.projectTypes }, null, 2)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error saving project types:', error);
            throw error;
        }
    }

    loadJsonEditor() {
        const editor = document.getElementById('json-editor');
        if (editor) {
            editor.value = JSON.stringify({ projectTypes: this.projectTypes }, null, 2);
        }
    }

    async saveJson() {
        try {
            const editor = document.getElementById('json-editor');
            if (!editor) return;

            const jsonData = JSON.parse(editor.value);
            this.projectTypes = jsonData.projectTypes || {};
            
            await this.saveProjectTypes();
            this.showStatus('JSON saved successfully');
        } catch (error) {
            console.error('Error saving JSON:', error);
            this.showStatus('Error saving JSON - invalid format', 'error');
        }
    }

    formatJson() {
        const editor = document.getElementById('json-editor');
        if (editor) {
            try {
                const parsed = JSON.parse(editor.value);
                editor.value = JSON.stringify(parsed, null, 2);
            } catch (error) {
                this.showStatus('Invalid JSON format', 'error');
            }
        }
    }

    validateJson() {
        const editor = document.getElementById('json-editor');
        if (!editor) return;

        try {
            JSON.parse(editor.value);
            editor.style.borderColor = 'var(--success)';
        } catch (error) {
            editor.style.borderColor = 'var(--error)';
        }
    }

    exportData() {
        const dataStr = JSON.stringify({ projectTypes: this.projectTypes }, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'portfolio-data.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (data.projectTypes) {
                    this.projectTypes = data.projectTypes;
                    await this.saveProjectTypes();
                    this.renderProjectTypeList();
                    this.showStatus('Data imported successfully');
                } else {
                    this.showStatus('Invalid data format', 'error');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                this.showStatus('Error importing data', 'error');
            }
        };
        
        input.click();
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
    }

    showStatus(message, type = 'success') {
        const statusBar = document.getElementById('status-bar');
        if (!statusBar) return;

        statusBar.textContent = message;
        statusBar.className = `status-bar status-${type} show`;
        
        setTimeout(() => {
            statusBar.classList.remove('show');
        }, 3000);
    }

    populateExistingImages(images) {
        const preview = document.getElementById('image-preview');
        if (!preview || !images || !Array.isArray(images)) {
            return;
        }
        
        // Clear existing preview
        preview.innerHTML = '';
        
        // Add each existing image
        images.forEach(image => {
            const imageItem = document.createElement('div');
            imageItem.className = 'image-item';
            
            imageItem.innerHTML = `
                <img src="${image.src}" alt="${image.title || 'Image'}" loading="lazy">
                <div class="image-overlay">
                    <div class="image-info">
                        <span>${image.dimensions || 'N/A'}</span>
                    </div>
                    <div class="image-metadata">
                        <input type="text" class="image-title" placeholder="Image title" value="${image.title || ''}" 
                               onchange="this.parentElement.parentElement.parentElement.dataset.imageTitle = this.value">
                        <textarea class="image-description" placeholder="Image description" 
                                  onchange="this.parentElement.parentElement.parentElement.dataset.imageDescription = this.value">${image.description || ''}</textarea>
                    </div>
                    <button class="image-remove">&times;</button>
                </div>
            `;
            
            // Store existing image data
            imageItem.dataset.imageData = JSON.stringify({
                original: { src: image.src },
                optimized: { src: image.src, dimensions: image.dimensions },
                serverInfo: image.serverInfo,
                title: image.title,
                description: image.description
            });
            imageItem.dataset.fileName = image.title || 'Image';
            imageItem.dataset.imageTitle = image.title || '';
            imageItem.dataset.imageDescription = image.description || '';
            
            preview.appendChild(imageItem);
        });
        
        // Update remove button functionality
        this.updateImageRemoveButtons();
        
        console.log(`Populated ${images.length} existing images`);
    }

    // Debug function to help troubleshoot image upload issues
    debugImageUpload() {
        console.log('=== IMAGE UPLOAD DEBUG ===');
        
        const preview = document.getElementById('image-preview');
        console.log('Image preview container:', preview);
        
        if (preview) {
            const imageItems = preview.querySelectorAll('.image-item');
            console.log(`Found ${imageItems.length} image items`);
            
            imageItems.forEach((item, index) => {
                const img = item.querySelector('img');
                const imageData = item.dataset.imageData;
                console.log(`Image ${index + 1}:`, {
                    element: item,
                    img: img,
                    src: img?.src,
                    alt: img?.alt,
                    imageData: imageData ? JSON.parse(imageData) : null,
                    fileName: item.dataset.fileName
                });
            });
        }
        
        // Check if imageOptimizer is available
        console.log('ImageOptimizer available:', typeof imageOptimizer !== 'undefined');
        if (typeof imageOptimizer !== 'undefined') {
            console.log('ImageOptimizer methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(imageOptimizer)));
        }
    }

    // Add debug button to admin panel
    addDebugButton() {
        const adminHeader = document.querySelector('.admin-header');
        if (adminHeader) {
            const debugBtn = document.createElement('button');
            debugBtn.className = 'btn btn-secondary';
            debugBtn.textContent = 'Debug Images';
            debugBtn.onclick = () => this.debugImageUpload();
            debugBtn.style.marginLeft = '1rem';
            adminHeader.appendChild(debugBtn);
        }
    }

    // Delete individual image from server and UI
    async deleteImage(imageItem) {
        try {
            const imageData = imageItem.dataset.imageData ? JSON.parse(imageItem.dataset.imageData) : null;
            
            // If the image was uploaded to server, delete it
            if (imageData?.serverInfo?.filename) {
                const response = await fetch(`/api/upload/image/${imageData.serverInfo.filename}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    console.log('Image deleted from server:', imageData.serverInfo.filename);
                } else {
                    console.warn('Failed to delete image from server:', imageData.serverInfo.filename);
                }
            }
            
            // Remove from UI
            imageItem.remove();
            this.showStatus('Image deleted successfully');
            
        } catch (error) {
            console.error('Error deleting image:', error);
            this.showStatus('Error deleting image', 'error');
        }
    }

    // Update image remove button to use the delete function
    updateImageRemoveButtons() {
        const imageItems = document.querySelectorAll('.image-item');
        imageItems.forEach(item => {
            const removeBtn = item.querySelector('.image-remove');
            if (removeBtn) {
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    this.deleteImage(item);
                };
            }
        });
    }
}

// Initialize admin
const admin = new PortfolioAdmin();

// Global functions for onclick handlers
function showSection(sectionName) {
    admin.showSection(sectionName);
}

function createNewProject(typeKey) {
    admin.createNewProject(typeKey);
}

function cancelEdit() {
    admin.renderProjectTypeList();
}

function deleteProject(typeKey, projectId) {
    admin.deleteProject(typeKey, projectId);
}

function saveJson() {
    admin.saveJson();
}

function formatJson() {
    admin.formatJson();
}

function exportData() {
    admin.exportData();
}

function importData() {
    admin.importData();
} 