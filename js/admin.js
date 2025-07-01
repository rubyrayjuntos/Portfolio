// Admin.js - Modern Content Management System
console.log('=== ADMIN.JS LOADED ===');

class PortfolioAdmin {
    constructor() {
        this.projectTypes = {};
        this.navigationData = {};
        this.currentProjectType = null;
        this.currentProject = null;
        this.pendingAction = null;
        this.init();
    }

    async init() {
        console.log('Admin: Initializing...');
        
        // Check authentication first
        const isAuthenticated = await this.checkAuth();
        if (!isAuthenticated) {
            window.location.href = '/admin-login.html';
            return;
        }
        
        console.log('Admin: Authentication successful, loading admin panel');
        
        await this.loadAllData();
        this.setupEventListeners();
        this.renderProjectTypes();
        this.loadNavigationContent();
        this.loadJsonEditors();
        
        console.log('Admin: Initialization complete');
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/auth/status', {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            return data.authenticated;
        } catch (error) {
            console.error('Admin: Auth check failed:', error);
            return false;
        }
    }

    async loadAllData() {
        try {
            // Load project types
            const projectsResponse = await fetch('/data/projects.json');
            if (projectsResponse.ok) {
                const data = await projectsResponse.json();
                this.projectTypes = data.projectTypes || {};
            }

            // Load navigation data (create if doesn't exist)
            try {
                const navResponse = await fetch('/data/navigation.json');
                if (navResponse.ok) {
                    this.navigationData = await navResponse.json();
                } else {
                    this.navigationData = this.getDefaultNavigationData();
                }
            } catch (error) {
                this.navigationData = this.getDefaultNavigationData();
            }

            console.log('Admin: Data loaded successfully');
        } catch (error) {
            console.error('Error loading data:', error);
            this.showStatus('Error loading data', 'error');
        }
    }

    getDefaultNavigationData() {
        return {
            navigation: {
                logo: "Portfolio",
                tagline: "Creative Developer"
            },
            accordion: {
                title: "My Work",
                subtitle: "Explore my creative projects"
            },
            footer: {
                copyright: "© 2024 Creative Developer",
                description: "Building digital experiences with creativity and code"
            }
        };
    }

    setupEventListeners() {
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Tag input functionality
        this.setupTagInputs();

        // Image upload functionality
        this.setupImageUpload();

        // Form submission
        const projectForm = document.getElementById('project-form');
        if (projectForm) {
            projectForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProject();
            });
        }
    }

    setupTagInputs() {
        // Setup tag input for any tag containers
        document.addEventListener('keypress', (e) => {
            if (e.target.classList.contains('tag-input') && e.key === 'Enter') {
                e.preventDefault();
                const value = e.target.value.trim();
                if (value) {
                    this.addTag(e.target.parentElement, value);
                    e.target.value = '';
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
        console.log('Setting up image upload functionality...');
        
        // Use event delegation to handle dynamically created upload areas
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
        });

        // Handle click events on upload areas
        document.addEventListener('click', (e) => {
            if (e.target.closest('.upload-area')) {
                const uploadArea = e.target.closest('.upload-area');
                this.handleUploadAreaClick(uploadArea);
            }
        });

        // Handle drag and drop events on upload areas
        document.addEventListener('dragover', (e) => {
            const uploadArea = e.target.closest('.upload-area');
            if (uploadArea) {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            }
        });

        document.addEventListener('dragleave', (e) => {
            const uploadArea = e.target.closest('.upload-area');
            if (uploadArea) {
                uploadArea.classList.remove('dragover');
            }
        });

        document.addEventListener('drop', (e) => {
            const uploadArea = e.target.closest('.upload-area');
            if (uploadArea) {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                const files = Array.from(e.dataTransfer.files);
                this.handleImageFiles(files, uploadArea);
            }
        });

        console.log('Image upload functionality setup complete');
    }

    handleUploadAreaClick(uploadArea) {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';
        input.onchange = (e) => {
            const files = Array.from(e.target.files);
            this.handleImageFiles(files, uploadArea);
        };
        input.click();
    }

    async handleImageFiles(files, uploadSection) {
        console.log('Handling image files:', files.length, 'files');
        console.log('Upload section:', uploadSection);
        
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showStatus('No valid image files selected', 'warning');
            return;
        }

        console.log('Processing', imageFiles.length, 'valid image files');

        for (const file of imageFiles) {
            try {
                console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
                
                // Show loading state
                const loadingItem = this.addImagePreview('', file.name, true, uploadSection);
                console.log('Loading item created:', loadingItem);
                
                // Upload image
                const formData = new FormData();
                formData.append('image', file);
                
                console.log('Sending upload request...');
                const response = await fetch('/api/upload/image', {
                    method: 'POST',
                    credentials: 'include',
                    body: formData
                });

                console.log('Upload response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('Upload failed with status:', response.status, 'Error:', errorText);
                    throw new Error(`Upload failed: ${response.status} - ${errorText}`);
                }

                const result = await response.json();
                console.log('Upload result:', result);
                
                // Remove loading item and add uploaded image
                if (loadingItem && loadingItem.parentNode) {
                    loadingItem.remove();
                    console.log('Loading item removed');
                }
                
                // Fix: Use the correct response format from server
                const imageUrl = result.file ? result.file.url : result.url;
                console.log('Image URL:', imageUrl);
                
                const imageData = {
                    src: imageUrl,
                    alt: file.name,
                    description: ''
                };
                
                const previewItem = this.addImagePreview(imageUrl, file.name, false, uploadSection, imageData);
                console.log('Preview item created:', previewItem);
                
                this.showStatus(`Image "${file.name}" uploaded successfully`, 'success');
                
            } catch (error) {
                console.error('Image upload error:', error);
                this.showStatus(`Failed to upload "${file.name}": ${error.message}`, 'error');
                
                // Remove loading item if it exists
                const loadingItems = document.querySelectorAll('.image-loading');
                loadingItems.forEach(item => {
                    if (item.textContent.includes(file.name)) {
                        item.parentElement.remove();
                    }
                });
            }
        }
    }

    addImagePreview(src, name, isLoading = false, container, imageData = null) {
        console.log('Adding image preview:', { src, name, isLoading, container: container?.className });
        
        // Find the image-upload-section parent to add preview to
        const uploadSection = container.closest('.image-upload-section');
        if (!uploadSection) {
            console.error('Could not find image-upload-section parent');
            return null;
        }
        
        console.log('Found upload section:', uploadSection);
        
        const preview = uploadSection.nextElementSibling || this.createImagePreviewContainer(uploadSection);
        console.log('Using preview container:', preview);
        
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        
        if (isLoading) {
            imageItem.innerHTML = `
                <div class="image-loading">
                    <div class="loading-spinner"></div>
                    <p>Uploading ${name}...</p>
                </div>
            `;
            console.log('Created loading item for:', name);
        } else {
            imageItem.innerHTML = `
                <img src="${src}" alt="${name}" />
                <button class="image-remove" onclick="admin.removeImage(this.parentElement)">&times;</button>
                <div class="image-overlay">
                    <input type="text" placeholder="Image title" value="${imageData?.alt || name}" onchange="this.parentElement.parentElement.dataset.title = this.value">
                    <textarea placeholder="Image description" onchange="this.parentElement.parentElement.dataset.description = this.value">${imageData?.description || ''}</textarea>
                </div>
            `;
            
            if (imageData) {
                imageItem.dataset.imageData = JSON.stringify(imageData);
            }
            console.log('Created image preview item for:', name, 'with src:', src);
        }
        
        preview.appendChild(imageItem);
        console.log('Added image item to preview container');
        return imageItem;
    }

    createImagePreviewContainer(uploadSection) {
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        uploadSection.parentNode.insertBefore(preview, uploadSection.nextSibling);
        return preview;
    }

    removeImage(imageItem) {
        if (confirm('Are you sure you want to remove this image?')) {
            imageItem.remove();
            this.showStatus('Image removed', 'success');
        }
    }

    // Navigation Content Management
    loadNavigationContent() {
        const nav = this.navigationData.navigation || {};
        const accordion = this.navigationData.accordion || {};
        const footer = this.navigationData.footer || {};

        // Populate form fields
        const fields = {
            'nav-logo': nav.logo || '',
            'nav-tagline': nav.tagline || '',
            'accordion-home-title': accordion.home?.title || '',
            'accordion-home-subtitle': accordion.home?.subtitle || '',
            'accordion-work-title': accordion.work?.title || '',
            'accordion-work-subtitle': accordion.work?.subtitle || '',
            'accordion-about-title': accordion.about?.title || '',
            'accordion-about-subtitle': accordion.about?.subtitle || '',
            'accordion-contact-title': accordion.contact?.title || '',
            'accordion-contact-subtitle': accordion.contact?.subtitle || '',
            'footer-copyright': footer.copyright || '',
            'footer-description': footer.description || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    }

    async saveNavigationContent() {
        try {
            const navigationData = {
                navigation: {
                    logo: document.getElementById('nav-logo').value,
                    tagline: document.getElementById('nav-tagline').value
                },
                accordion: {
                    home: {
                        title: document.getElementById('accordion-home-title').value,
                        subtitle: document.getElementById('accordion-home-subtitle').value
                    },
                    work: {
                        title: document.getElementById('accordion-work-title').value,
                        subtitle: document.getElementById('accordion-work-subtitle').value
                    },
                    about: {
                        title: document.getElementById('accordion-about-title').value,
                        subtitle: document.getElementById('accordion-about-subtitle').value
                    },
                    contact: {
                        title: document.getElementById('accordion-contact-title').value,
                        subtitle: document.getElementById('accordion-contact-subtitle').value
                    }
                },
                footer: {
                    copyright: document.getElementById('footer-copyright').value,
                    description: document.getElementById('footer-description').value
                }
            };

            console.log('Saving navigation data:', navigationData);

            const response = await fetch('/data/navigation.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(navigationData, null, 2)
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (response.ok) {
                const result = await response.json();
                console.log('Save successful:', result);
                this.navigationData = navigationData;
                this.showStatus('Navigation content saved successfully', 'success');
            } else {
                const errorText = await response.text();
                console.error('Server error response:', errorText);
                throw new Error(`Server error: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error saving navigation content:', error);
            this.showStatus(`Error saving navigation content: ${error.message}`, 'error');
        }
    }

    // Project Types Management
    renderProjectTypes() {
        const grid = document.getElementById('project-types-grid');
        const selector = document.getElementById('project-type-selector');
        
        if (!grid || !selector) return;

        grid.innerHTML = '';
        selector.innerHTML = '<option value="">Select Project Type</option>';

        // Sort project types by order (featured field as integer)
        const sortedTypes = Object.entries(this.projectTypes).sort(([,a], [,b]) => {
            const orderA = parseInt(a.featured) || 999;
            const orderB = parseInt(b.featured) || 999;
            return orderA - orderB;
        });

        sortedTypes.forEach(([key, type]) => {
            // Add to grid
            const card = this.createProjectTypeCard(key, type);
            grid.appendChild(card);

            // Add to selector
            const option = document.createElement('option');
            option.value = key;
            option.textContent = type.title;
            selector.appendChild(option);
        });
    }

    createProjectTypeCard(key, type) {
        const card = document.createElement('div');
        card.className = 'project-type-card';
        
        const projectCount = type.projects ? type.projects.length : 0;
        const postCount = type.posts ? type.posts.length : 0;
        const totalCount = projectCount + postCount;
        const order = parseInt(type.featured) || 999;

        card.innerHTML = `
            <div class="project-type-header">
                <div class="project-type-icon">${type.icon || '📁'}</div>
                <div class="project-type-info">
                    <h3>${type.title}</h3>
                    <p>${type.description}</p>
                </div>
                <div class="project-type-order">
                    <label>Order:</label>
                    <input type="number" class="order-input" value="${order}" min="1" 
                           onclick="event.stopPropagation()" 
                           onchange="admin.updateProjectTypeOrder('${key}', this.value)">
                </div>
            </div>
            <div class="project-type-stats">
                <div class="stat-item">
                    <div class="stat-number">${totalCount}</div>
                    <div class="stat-label">Total</div>
                </div>
                <div class="stat-item">
                    <div class="stat-number">${order}</div>
                    <div class="stat-label">Order</div>
                </div>
            </div>
            <div class="project-type-actions">
                <button class="btn-edit" onclick="event.stopPropagation(); admin.editProjectType('${key}')">Edit</button>
            </div>
        `;

        return card;
    }

    editProjectType(typeKey) {
        this.currentProjectType = typeKey;
        this.showSection('projects');
        this.loadProjectsForType();
    }

    updateProjectTypeOrder(typeKey, newOrder) {
        if (!this.projectTypes[typeKey]) return;
        
        const order = parseInt(newOrder) || 999;
        this.projectTypes[typeKey].featured = order;
        
        this.saveProjectTypes();
        this.renderProjectTypes();
        this.showStatus(`Order updated for ${this.projectTypes[typeKey].title}`, 'success');
    }

    updateProjectOrder(typeKey, index, newOrder) {
        const type = this.projectTypes[typeKey];
        if (!type) return;
        
        const items = type.projects || type.posts || [];
        if (index >= items.length) return;
        
        const order = parseInt(newOrder) || 999;
        items[index].featured = order;
        
        this.saveProjectTypes();
        this.loadProjectsForType();
        this.showStatus(`Order updated for ${items[index].title}`, 'success');
    }

    createNewProjectType() {
        const typeKey = prompt('Enter project type key (e.g., "gallery", "blog"):');
        if (!typeKey) return;

        const title = prompt('Enter project type title:');
        if (!title) return;

        const description = prompt('Enter project type description:');
        const icon = prompt('Enter emoji icon (optional):') || '📁';

        this.projectTypes[typeKey] = {
            title,
            description: description || '',
            icon,
            projects: [],
            posts: []
        };

        this.renderProjectTypes();
        this.saveProjectTypes();
        this.showStatus('Project type created successfully', 'success');
    }

    // Project Management
    loadProjectsForType() {
        const typeKey = this.currentProjectType || document.getElementById('project-type-selector').value;
        if (!typeKey) return;

        this.currentProjectType = typeKey;
        document.getElementById('create-project-btn').disabled = false;

        const projectList = document.getElementById('project-list');
        if (!projectList) return;

        const type = this.projectTypes[typeKey];
        if (!type) return;

        const items = type.projects || type.posts || [];
        
        // Sort items by order (featured field as integer)
        const sortedItems = items.sort((a, b) => {
            const orderA = parseInt(a.featured) || 999;
            const orderB = parseInt(b.featured) || 999;
            return orderA - orderB;
        });
        
        projectList.innerHTML = '';

        if (sortedItems.length === 0) {
            projectList.innerHTML = '<p>No projects found. Click "Add Project" to create one.</p>';
            return;
        }

        sortedItems.forEach((item, index) => {
            const originalIndex = items.indexOf(item);
            const projectItem = this.createProjectItem(typeKey, item, originalIndex);
            projectList.appendChild(projectItem);
        });
    }

    createProjectItem(typeKey, item, index) {
        const div = document.createElement('div');
        div.className = 'project-item';
        
        const order = parseInt(item.featured) || 999;
        
        div.innerHTML = `
            <div class="project-info">
                <h4>${item.title}</h4>
                <p>${item.description || 'No description'}</p>
            </div>
            <div class="project-order">
                <label>Order:</label>
                <input type="number" class="order-input" value="${order}" min="1" 
                       onchange="admin.updateProjectOrder('${typeKey}', ${index}, this.value)">
            </div>
            <div class="project-actions">
                <button class="btn-edit" onclick="admin.editProject('${typeKey}', ${index})">Edit</button>
                <button class="btn-delete" onclick="admin.deleteProject('${typeKey}', ${index})">Delete</button>
            </div>
        `;

        return div;
    }

    createNewProject() {
        const typeKey = this.currentProjectType;
        if (!typeKey) {
            this.showStatus('Please select a project type first', 'warning');
            return;
        }

        this.currentProject = null;
        this.showProjectEditor(typeKey);
    }

    editProject(typeKey, index) {
        const type = this.projectTypes[typeKey];
        if (!type) return;

        const items = type.projects || type.posts || [];
        if (index >= items.length) return;

        this.currentProjectType = typeKey;
        this.currentProject = index;
        this.showProjectEditor(typeKey, items[index]);
    }

    showProjectEditor(typeKey, project = null) {
        const editor = document.getElementById('project-editor');
        const form = document.getElementById('project-form');
        
        if (!editor || !form) return;

        editor.style.display = 'block';
        document.getElementById('editor-title').textContent = project ? 'Edit Project' : 'Create New Project';

        form.innerHTML = this.generateProjectForm(typeKey, project);
        this.setupFormEventListeners();
        
        // Scroll to editor
        editor.scrollIntoView({ behavior: 'smooth' });
    }

    generateProjectForm(typeKey, project = null) {
        const isNew = !project;
        const projectData = project || {};

        let formHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label for="project-id">Project ID</label>
                    <input type="text" id="project-id" value="${projectData.id || ''}" ${isNew ? '' : 'readonly'}>
                </div>
                <div class="form-group">
                    <label for="project-title">Title</label>
                    <input type="text" id="project-title" value="${projectData.title || ''}" required>
                </div>
                <div class="form-group">
                    <label for="project-description">Description</label>
                    <textarea id="project-description" required>${projectData.description || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="project-content">Content</label>
                    <textarea id="project-content" class="full-width">${projectData.content || ''}</textarea>
                </div>
                <div class="form-group">
                    <label for="project-date">Date</label>
                    <input type="date" id="project-date" value="${projectData.date || new Date().toISOString().split('T')[0]}">
                </div>
                <div class="form-group">
                    <label for="project-featured">Display Order</label>
                    <input type="number" id="project-featured" value="${parseInt(projectData.featured) || 999}" min="1" 
                           placeholder="1 = first, 2 = second, etc.">
                    <small class="form-hint">Lower numbers appear first. Use 1 for first position.</small>
                </div>
                <div class="form-group full-width">
                    <label for="project-tags">Tags</label>
                    <div class="tag-input" id="project-tags">
                        <input type="text" placeholder="Add tags (press Enter)">
                    </div>
                </div>
                <div class="form-group full-width">
                    <label>Images</label>
                    <div class="image-upload-section">
                        <div class="upload-area">
                            <div class="upload-icon">📷</div>
                            <p>Click or drag images here to upload</p>
                            <p class="upload-hint">Supports multiple images. Drag and drop or click to select.</p>
                        </div>
                    </div>
                </div>
        `;

        // Add type-specific fields
        switch (typeKey) {
            case 'gallery':
                formHTML += `
                    <div class="form-group">
                        <label for="project-medium">Medium</label>
                        <input type="text" id="project-medium" value="${projectData.medium || ''}" placeholder="e.g., Digital Art, Photography, Mixed Media">
                    </div>
                    <div class="form-group">
                        <label for="project-dimensions">Dimensions</label>
                        <input type="text" id="project-dimensions" value="${projectData.dimensions || ''}" placeholder="e.g., 1920x1080, 3000x2000">
                    </div>
                    <div class="form-group">
                        <label for="project-year">Year Created</label>
                        <input type="number" id="project-year" value="${projectData.year || new Date().getFullYear()}">
                    </div>
                `;
                break;

            case 'blog':
                formHTML += `
                    <div class="form-group">
                        <label for="project-author">Author</label>
                        <input type="text" id="project-author" value="${projectData.author || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-category">Category</label>
                        <input type="text" id="project-category" value="${projectData.category || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-read-time">Read Time</label>
                        <input type="text" id="project-read-time" value="${projectData.readTime || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-slug">Slug</label>
                        <input type="text" id="project-slug" value="${projectData.slug || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-cover-image">Cover Image URL</label>
                        <input type="text" id="project-cover-image" value="${projectData.coverImage || ''}">
                    </div>
                `;
                break;

            case 'demo':
                formHTML += `
                    <div class="form-group full-width">
                        <label for="project-technologies">Technologies</label>
                        <div class="tag-input" id="project-technologies">
                            <input type="text" placeholder="Add technologies (press Enter)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="project-live-url">Live URL</label>
                        <input type="url" id="project-live-url" value="${projectData.liveUrl || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-github-url">GitHub URL</label>
                        <input type="url" id="project-github-url" value="${projectData.githubUrl || ''}">
                    </div>
                `;
                break;

            case 'stories':
                formHTML += `
                    <div class="form-group">
                        <label for="project-genre">Genre</label>
                        <input type="text" id="project-genre" value="${projectData.genre || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-word-count">Word Count</label>
                        <input type="number" id="project-word-count" value="${projectData.wordCount || 0}">
                    </div>
                `;
                break;

            case 'brand':
                formHTML += `
                    <div class="form-group">
                        <label for="project-client">Client</label>
                        <input type="text" id="project-client" value="${projectData.client || ''}">
                    </div>
                    <div class="form-group full-width">
                        <label for="project-services">Services</label>
                        <div class="tag-input" id="project-services">
                            <input type="text" placeholder="Add services (press Enter)">
                        </div>
                    </div>
                `;
                break;

            case 'github':
                formHTML += `
                    <div class="form-group full-width">
                        <label for="project-technologies">Technologies</label>
                        <div class="tag-input" id="project-technologies">
                            <input type="text" placeholder="Add technologies (press Enter)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="project-github-url">GitHub URL</label>
                        <input type="url" id="project-github-url" value="${projectData.githubUrl || ''}">
                    </div>
                    <div class="form-group">
                        <label for="project-stars">Stars</label>
                        <input type="number" id="project-stars" value="${projectData.stars || 0}">
                    </div>
                    <div class="form-group">
                        <label for="project-forks">Forks</label>
                        <input type="number" id="project-forks" value="${projectData.forks || 0}">
                    </div>
                `;
                break;
        }

        formHTML += `
            <div class="action-buttons">
                <button type="submit" class="btn btn-success">Save Project</button>
                <button type="button" class="btn btn-secondary" onclick="admin.cancelEdit()">Cancel</button>
            </div>
        `;

        return formHTML;
    }

    setupFormEventListeners() {
        console.log('Setting up form event listeners...');
        
        // Populate existing tags
        this.populateExistingTags();
        
        // Setup image upload functionality
        this.setupImageUpload();
        
        // Populate existing images for projects that have them
        if (this.currentProject !== null) {
            const type = this.projectTypes[this.currentProjectType];
            const items = type.projects || type.posts || [];
            if (this.currentProject < items.length && items[this.currentProject].images) {
                console.log('Populating existing images for project:', items[this.currentProject].title);
                this.populateExistingImages(items[this.currentProject].images);
            }
        }
        
        console.log('Form event listeners setup complete');
    }

    populateExistingTags() {
        const typeKey = this.currentProjectType;
        const projectIndex = this.currentProject;
        
        if (projectIndex === null) return;

        const type = this.projectTypes[typeKey];
        const items = type.projects || type.posts || [];
        if (projectIndex >= items.length) return;

        const item = items[projectIndex];

        // Populate tags
        if (item.tags) {
            const tagContainer = document.getElementById('project-tags');
            if (tagContainer) {
                item.tags.forEach(tag => this.addTag(tagContainer, tag));
            }
        }

        // Populate technologies/services
        const techContainer = document.getElementById('project-technologies') || document.getElementById('project-services');
        if (techContainer && (item.technologies || item.services)) {
            const techs = item.technologies || item.services || [];
            techs.forEach(tech => this.addTag(techContainer, tech));
        }
    }

    populateExistingImages(images) {
        console.log('Populating existing images:', images);
        
        const uploadArea = document.querySelector('.upload-area');
        if (!uploadArea) {
            console.error('Could not find upload area for existing images');
            return;
        }

        console.log('Found upload area, adding', images.length, 'existing images');
        
        images.forEach((image, index) => {
            console.log('Adding existing image', index + 1, ':', image);
            this.addImagePreview(image.src, image.alt || 'Image', false, uploadArea, {
                src: image.src,
                alt: image.alt || '',
                description: image.description || ''
            });
        });
    }

    async saveProject() {
        try {
            const formData = this.getFormData();
            const typeKey = this.currentProjectType;
            
            if (!typeKey) {
                this.showStatus('No project type selected', 'error');
                return;
            }

            const type = this.projectTypes[typeKey];
            if (!type) {
                this.showStatus('Invalid project type', 'error');
                return;
            }

            const items = type.projects || type.posts || [];
            
            if (this.currentProject !== null) {
                // Update existing project
                items[this.currentProject] = formData;
            } else {
                // Add new project
                items.push(formData);
            }

            await this.saveProjectTypes();
            this.loadProjectsForType();
            this.hideProjectEditor();
            this.showStatus('Project saved successfully', 'success');
            
        } catch (error) {
            console.error('Error saving project:', error);
            this.showStatus('Error saving project', 'error');
        }
    }

    getFormData() {
        const formData = {
            id: document.getElementById('project-id').value,
            title: document.getElementById('project-title').value,
            description: document.getElementById('project-description').value,
            content: document.getElementById('project-content').value,
            date: document.getElementById('project-date').value,
            featured: parseInt(document.getElementById('project-featured').value) || 999,
            tags: this.getTagsFromContainer('project-tags'),
            images: this.getImagesFromPreview()
        };

        const typeKey = this.currentProjectType;

        switch (typeKey) {
            case 'gallery':
                formData.medium = document.getElementById('project-medium')?.value || '';
                formData.dimensions = document.getElementById('project-dimensions')?.value || '';
                formData.year = parseInt(document.getElementById('project-year')?.value) || new Date().getFullYear();
                break;

            case 'blog':
                formData.author = document.getElementById('project-author').value;
                formData.category = document.getElementById('project-category').value;
                formData.readTime = document.getElementById('project-read-time').value;
                formData.slug = document.getElementById('project-slug').value;
                formData.coverImage = document.getElementById('project-cover-image').value;
                break;

            case 'demo':
                formData.technologies = this.getTagsFromContainer('project-technologies');
                formData.liveUrl = document.getElementById('project-live-url').value;
                formData.githubUrl = document.getElementById('project-github-url').value;
                break;

            case 'stories':
                formData.genre = document.getElementById('project-genre').value;
                formData.wordCount = parseInt(document.getElementById('project-word-count').value) || 0;
                break;

            case 'brand':
                formData.client = document.getElementById('project-client').value;
                formData.services = this.getTagsFromContainer('project-services');
                break;

            case 'github':
                formData.technologies = this.getTagsFromContainer('project-technologies');
                formData.githubUrl = document.getElementById('project-github-url').value;
                formData.stars = parseInt(document.getElementById('project-stars').value) || 0;
                formData.forks = parseInt(document.getElementById('project-forks').value) || 0;
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
        const preview = document.querySelector('.image-preview');
        if (!preview) return [];
        
        return Array.from(preview.querySelectorAll('.image-item'))
            .map(item => {
                // Try to get stored image data first
                let imageData = null;
                if (item.dataset.imageData) {
                    try {
                        imageData = JSON.parse(item.dataset.imageData);
                    } catch (e) {
                        console.warn('Failed to parse image data:', e);
                    }
                }
                
                // Get title and description from overlay inputs or dataset
                const title = item.dataset.title || item.querySelector('.image-overlay input')?.value || imageData?.alt || 'Image';
                const description = item.dataset.description || item.querySelector('.image-overlay textarea')?.value || '';
                
                // Use stored image data if available, otherwise fall back to img src
                const src = imageData?.src || imageData?.url || item.querySelector('img')?.src || '';
                
                return {
                    src: src,
                    alt: title,
                    description: description
                };
            })
            .filter(img => img.src);
    }

    async deleteProject(typeKey, index) {
        this.showConfirmation(
            'Delete Project',
            'Are you sure you want to delete this project? This action cannot be undone.',
            () => this.performDeleteProject(typeKey, index)
        );
    }

    async performDeleteProject(typeKey, index) {
        try {
            const type = this.projectTypes[typeKey];
            if (!type) return;

            const items = type.projects || type.posts || [];
            if (index >= items.length) return;

            items.splice(index, 1);
            await this.saveProjectTypes();
            this.loadProjectsForType();
            this.showStatus('Project deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showStatus('Error deleting project', 'error');
        }
    }

    cancelEdit() {
        this.hideProjectEditor();
    }

    hideProjectEditor() {
        const editor = document.getElementById('project-editor');
        if (editor) {
            editor.style.display = 'none';
        }
        this.currentProject = null;
    }

    // JSON Editor Management
    loadJsonEditors() {
        const projectsEditor = document.getElementById('projects-json-editor');
        const navigationEditor = document.getElementById('navigation-json-editor');
        
        if (projectsEditor) {
            projectsEditor.value = JSON.stringify(this.projectTypes, null, 2);
        }
        
        if (navigationEditor) {
            navigationEditor.value = JSON.stringify(this.navigationData, null, 2);
        }
    }

    async saveJson() {
        try {
            const projectsEditor = document.getElementById('projects-json-editor');
            const navigationEditor = document.getElementById('navigation-json-editor');
            
            if (projectsEditor) {
                const projectsData = JSON.parse(projectsEditor.value);
                this.projectTypes = projectsData.projectTypes || projectsData;
            }
            
            if (navigationEditor) {
                this.navigationData = JSON.parse(navigationEditor.value);
            }

            await this.saveProjectTypes();
            await this.saveNavigationContent();
            
            this.renderProjectTypes();
            this.loadNavigationContent();
            
            this.showStatus('JSON data saved successfully', 'success');
        } catch (error) {
            console.error('Error saving JSON:', error);
            this.showStatus('Error saving JSON: ' + error.message, 'error');
        }
    }

    formatJson() {
        const editors = ['projects-json-editor', 'navigation-json-editor'];
        
        editors.forEach(editorId => {
            const editor = document.getElementById(editorId);
            if (editor) {
                try {
                    const parsed = JSON.parse(editor.value);
                    editor.value = JSON.stringify(parsed, null, 2);
                } catch (error) {
                    this.showStatus('Invalid JSON in ' + editorId, 'error');
                }
            }
        });
    }

    // Data Persistence
    async saveProjectTypes() {
        try {
            const response = await fetch('/data/projects.json', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ projectTypes: this.projectTypes }, null, 2)
            });

            if (!response.ok) {
                throw new Error('Failed to save project types');
            }
        } catch (error) {
            console.error('Error saving project types:', error);
            throw error;
        }
    }

    // Preview Management
    loadPortfolioPreview() {
        const preview = document.getElementById('portfolio-preview');
        const loading = document.getElementById('preview-loading');
        
        if (preview && loading) {
            loading.style.display = 'none';
            preview.style.display = 'block';
            preview.src = '/';
        }
    }

    togglePreviewTheme() {
        const preview = document.getElementById('portfolio-preview');
        if (preview && preview.contentWindow) {
            preview.contentWindow.postMessage({ type: 'toggleTheme' }, '*');
        }
    }

    // Export/Import
    exportData() {
        const data = {
            projectTypes: this.projectTypes,
            navigation: this.navigationData
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'portfolio-data.json';
        a.click();
        URL.revokeObjectURL(url);
        
        this.showStatus('Data exported successfully', 'success');
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
                }
                if (data.navigation) {
                    this.navigationData = data.navigation;
                }
                
                await this.saveProjectTypes();
                await this.saveNavigationContent();
                
                this.renderProjectTypes();
                this.loadNavigationContent();
                this.loadJsonEditors();
                
                this.showStatus('Data imported successfully', 'success');
            } catch (error) {
                console.error('Error importing data:', error);
                this.showStatus('Error importing data: ' + error.message, 'error');
            }
        };
        input.click();
    }

    // Section Management
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionName + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    // Confirmation Dialog
    showConfirmation(title, message, callback) {
        this.pendingAction = callback;
        document.getElementById('confirmation-title').textContent = title;
        document.getElementById('confirmation-message').textContent = message;
        document.getElementById('confirmation-dialog').classList.add('show');
    }

    hideConfirmation() {
        document.getElementById('confirmation-dialog').classList.remove('show');
        this.pendingAction = null;
    }

    confirmAction() {
        if (this.pendingAction) {
            this.pendingAction();
        }
        this.hideConfirmation();
    }

    // Logout
    async logout() {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
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

    // Status Management
    showStatus(message, type = 'success') {
        const statusBar = document.getElementById('status-bar');
        if (!statusBar) return;

        statusBar.textContent = message;
        statusBar.className = `status-bar status-${type} show`;

        setTimeout(() => {
            statusBar.classList.remove('show');
        }, 3000);
    }
}

// Initialize admin when DOM is loaded
let admin;
document.addEventListener('DOMContentLoaded', () => {
    admin = new PortfolioAdmin();
});

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    if (admin) admin.showSection(sectionName);
}

function createNewProject() {
    if (admin) admin.createNewProject();
}

function cancelEdit() {
    if (admin) admin.cancelEdit();
}

function deleteProject(typeKey, index) {
    if (admin) admin.deleteProject(typeKey, index);
}

function saveJson() {
    if (admin) admin.saveJson();
}

function formatJson() {
    if (admin) admin.formatJson();
}

function exportData() {
    if (admin) admin.exportData();
}

function importData() {
    if (admin) admin.importData();
} 