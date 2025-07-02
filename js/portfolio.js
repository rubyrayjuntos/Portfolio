// PortfolioManager - Manages portfolio data and rendering
// Version: 1.3 - Added proper logging and security improvements

logger.info('PortfolioManager: Loading version 1.3 with security improvements...');

class PortfolioManager {
    constructor() {
        this.projectTypes = {};
        this.currentView = 'types'; // 'types', 'list', 'detail'
        this.currentType = null;
        this.currentProject = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        logger.debug('PortfolioManager: Starting initialization...');
        try {
            await this.loadProjects();
            logger.debug('PortfolioManager: Projects loaded, calling renderProjectTypes...');
            this.renderProjectTypes();
            logger.debug('PortfolioManager: renderProjectTypes completed');
            this.setupEventListeners();
            this.isInitialized = true;
            logger.info('PortfolioManager initialized successfully');
        } catch (error) {
            logger.error('PortfolioManager: Initialization failed:', error);
            utils.showError('Failed to load portfolio content');
        }
    }

    async loadProjects() {
        logger.debug('PortfolioManager: Starting loadProjects...');
        try {
            logger.debug('PortfolioManager: Fetching from /data/projects.json...');
            const timestamp = Date.now();
            const random = Math.random();
            const response = await fetch(`/data/projects.json?v=${timestamp}&r=${random}`);
            logger.debug('PortfolioManager: Fetch response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            logger.debug('PortfolioManager: Raw JSON data received');
            logger.debug('PortfolioManager: Data type:', typeof data);
            logger.debug('PortfolioManager: Data keys:', Object.keys(data));
            logger.debug('PortfolioManager: Has projectTypes:', !!data.projectTypes);
            
            if (data.projectTypes && typeof data.projectTypes === 'object') {
                this.projectTypes = data.projectTypes;
                logger.debug('PortfolioManager: Project types loaded, keys:', Object.keys(this.projectTypes));
                logger.debug('PortfolioManager: Blog type exists:', !!this.projectTypes.blog);
                logger.debug('PortfolioManager: Gallery projects count:', this.projectTypes.gallery?.projects?.length);
                logger.debug('PortfolioManager: Blog posts count:', this.projectTypes.blog?.posts?.length);
            } else {
                logger.warn('PortfolioManager: No project types found in data, using fallback');
                this.projectTypes = this.getFallbackProjectTypes();
            }
            
            logger.debug('PortfolioManager: Final project types loaded');
        } catch (error) {
            logger.error('PortfolioManager: Error loading projects:', error);
            logger.warn('PortfolioManager: Using fallback project types');
            this.projectTypes = this.getFallbackProjectTypes();
        }
    }

    getFallbackProjectTypes() {
        // Fallback data in case JSON loading fails
        return {
            gallery: {
                title: "Digital Art Collection",
                description: "A series of abstract digital paintings exploring color theory and emotional expression through generative techniques.",
                icon: "🎨",
                projects: [
                    {
                        id: "fallback-gallery",
                        title: "Abstract Harmony",
                        description: "A generative art piece exploring the relationship between color and emotion.",
                        content: "This is a fallback gallery item.",
                        tags: ["generative art", "abstract"],
                        date: "2024-01-15",
                        featured: true
                    }
                ]
            },
            blog: {
                title: "Creative Writing & Thoughts",
                description: "Exploring ideas at the intersection of technology, art, and human experience through writing.",
                icon: "✍️",
                posts: [
                    {
                        id: "fallback-blog",
                        title: "The Future of AI in Creative Expression",
                        description: "Exploring how artificial intelligence is reshaping the creative landscape.",
                        content: "This is a fallback blog post.",
                        author: "Creative Developer",
                        date: "2024-03-15",
                        readTime: "5 min read",
                        category: "Technology",
                        tags: ["AI", "creativity"],
                        featured: true,
                        slug: "fallback-blog"
                    }
                ]
            },
            demo: {
                title: "Interactive Web Applications",
                description: "Interactive web applications and demos showcasing modern web technologies and creative coding.",
                icon: "🚀",
                projects: [
                    {
                        id: "fallback-demo",
                        title: "Interactive Data Visualization Dashboard",
                        description: "A responsive dashboard for visualizing complex datasets.",
                        content: "This is a fallback demo project.",
                        technologies: ["React", "D3.js"],
                        tags: ["web development", "data visualization"],
                        date: "2024-01-10",
                        featured: true
                    }
                ]
            },
            stories: {
                title: "Creative Writing Samples",
                description: "Explore my creative writing samples across different genres and styles.",
                icon: "📚",
                projects: [
                    {
                        id: "fallback-story",
                        title: "Digital Dreams",
                        description: "A speculative fiction short story exploring consciousness in the digital age.",
                        content: "This is a fallback story.",
                        genre: "Speculative Fiction",
                        wordCount: 2500,
                        tags: ["speculative fiction", "AI"],
                        date: "2024-03-01",
                        featured: true
                    }
                ]
            },
            brand: {
                title: "Brand Identity & Design",
                description: "Discover the visual identity and branding elements of my projects and collaborations.",
                icon: "🎨",
                projects: [
                    {
                        id: "fallback-brand",
                        title: "Tech Startup Brand Identity",
                        description: "Complete brand identity design for a cutting-edge technology startup.",
                        content: "This is a fallback brand project.",
                        client: "EcoTech Solutions",
                        services: ["Logo Design", "Brand Guidelines"],
                        tags: ["branding", "logo design"],
                        date: "2024-01-20",
                        featured: true
                    }
                ]
            },
            github: {
                title: "GitHub Repositories",
                description: "Explore my open-source projects and contributions on GitHub.",
                icon: "💻",
                projects: [
                    {
                        id: "fallback-github",
                        title: "Generative Art Library",
                        description: "An open-source JavaScript library for creating generative art.",
                        content: "This is a fallback GitHub project.",
                        technologies: ["JavaScript", "Canvas API"],
                        githubUrl: "https://github.com/example/generative-art-lib",
                        stars: 150,
                        forks: 25,
                        tags: ["open source", "generative art"],
                        date: "2024-01-05",
                        featured: true
                    }
                ]
            }
        };
    }

    renderProjectTypes() {
        const container = document.getElementById('portfolio-container');
        if (!container) return;

        // Sort project types by order (featured field as integer)
        const types = Object.entries(this.projectTypes).sort(([,a], [,b]) => {
            const orderA = parseInt(a.featured) || 999;
            const orderB = parseInt(b.featured) || 999;
            return orderA - orderB;
        });
        
        // Clear container safely
        container.innerHTML = '';
        
        // Removed section header (Work heading and subheading)
        // Create project types grid
        const typesGrid = createSafeElement('div', 'project-types-grid');
        
        types.forEach(([typeKey, typeData]) => {
            const typeCard = createSafeElement('div', 'project-type-card');
            typeCard.setAttribute('data-type', typeKey);
            typeCard.onclick = () => this.showProjectList(typeKey);
            
            const typeIcon = createSafeElement('div', 'type-icon', typeData.icon || '📁');
            const typeTitle = createSafeElement('h3', '', typeData.title || 'Untitled');
            const typeDesc = createSafeElement('p', '', typeData.description || '');
            const typeCount = createSafeElement('div', 'type-count', 
                `${this.getTypeCount(typeKey, typeData)} ${typeKey === 'blog' ? 'posts' : 'projects'}`);
            
            typeCard.appendChild(typeIcon);
            typeCard.appendChild(typeTitle);
            typeCard.appendChild(typeDesc);
            typeCard.appendChild(typeCount);
            
            typesGrid.appendChild(typeCard);
        });
        
        container.appendChild(typesGrid);
    }

    getTypeCount(typeKey, typeData) {
        if (typeKey === 'blog') {
            return typeData.posts ? typeData.posts.length : 0;
        } else {
            return typeData.projects ? typeData.projects.length : 0;
        }
    }

    showProjectList(typeKey) {
        const container = document.getElementById('portfolio-container');
        if (!container) return;

        const typeData = this.projectTypes[typeKey];
        if (!typeData) return;

        this.currentType = typeKey;
        this.currentView = 'list';

        let items = [];
        if (typeKey === 'blog') {
            items = typeData.posts || [];
        } else {
            items = typeData.projects || [];
        }

        // Sort items by order (featured field as integer)
        items.sort((a, b) => {
            const orderA = parseInt(a.featured) || 999;
            const orderB = parseInt(b.featured) || 999;
            return orderA - orderB;
        });

        // Clear container safely
        container.innerHTML = '';
        
        // Create section header
        const sectionHeader = createSafeElement('div', 'section-header');
        
        const backBtn = createSafeElement('button', 'btn btn-secondary');
        backBtn.setAttribute('data-action', 'back-to-types');
        backBtn.textContent = '← Back to Work';
        backBtn.onclick = () => this.renderProjectTypes();
        
        const headerTitle = createSafeElement('h2', '', typeData.title || 'Untitled');
        const headerDesc = createSafeElement('p', '', typeData.description || '');
        
        sectionHeader.appendChild(backBtn);
        sectionHeader.appendChild(headerTitle);
        sectionHeader.appendChild(headerDesc);
        container.appendChild(sectionHeader);
        
        // Create project list
        const projectList = createSafeElement('div', 'project-list');
        
        items.forEach(item => {
            const projectItem = createSafeElement('div', 'project-item');
            projectItem.onclick = () => this.showProjectDetail(typeKey, item.id);
            
            const projectPreview = createSafeElement('div', 'project-preview');
            projectPreview.innerHTML = this.getProjectPreview(typeKey, item);
            
            const projectInfo = createSafeElement('div', 'project-info');
            const projectTitle = createSafeElement('h3', '', item.title || 'Untitled');
            const projectDesc = createSafeElement('p', '', item.description || '');
            
            projectInfo.appendChild(projectTitle);
            projectInfo.appendChild(projectDesc);
            
            // Add meta information
            const metaHTML = this.getProjectMeta(typeKey, item);
            const metaContainer = createSafeElement('div');
            metaContainer.innerHTML = metaHTML;
            projectInfo.appendChild(metaContainer);
            
            projectItem.appendChild(projectPreview);
            projectItem.appendChild(projectInfo);
            projectList.appendChild(projectItem);
        });
        
        container.appendChild(projectList);
        this.updateURL('list', typeKey);
    }

    getProjectPreview(typeKey, item) {
        switch (typeKey) {
            case 'gallery':
                return item.images && item.images.length > 0 
                    ? `<img src="${item.images[0].src}" alt="${item.title}">`
                    : '<div class="placeholder-image">🎨</div>';
            
            case 'blog':
                return item.coverImage 
                    ? `<img src="${item.coverImage}" alt="${item.title}">`
                    : '<div class="placeholder-image">✍️</div>';
            
            case 'demo':
                return '<div class="placeholder-image">🚀</div>';
            
            case 'stories':
                return '<div class="placeholder-image">📚</div>';
            
            case 'brand':
                return '<div class="placeholder-image">🎨</div>';
            
            case 'github':
                return item.images && item.images.length > 0
                    ? `<img src="${item.images[0].src}" alt="${item.title}">`
                    : '<div class="placeholder-image">💻</div>';
            
            default:
                return '<div class="placeholder-image">📁</div>';
        }
    }

    getProjectMeta(typeKey, item) {
        switch (typeKey) {
            case 'gallery':
                return `
                    <div class="project-meta">
                        <span class="theme">${item.theme || 'Digital Art'}</span>
                        <span class="year">${item.year}</span>
                    </div>
                `;
            
            case 'blog':
                return `
                    <div class="project-meta">
                        <span class="category">${item.category}</span>
                        <span class="read-time">${item.readTime}</span>
                        <span class="date">${new Date(item.date).toLocaleDateString()}</span>
                    </div>
                `;
            
            case 'demo':
                return `
                    <div class="project-meta">
                        <span class="technologies">${item.technologies ? item.technologies.join(', ') : 'N/A'}</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                `;
            
            case 'stories':
                return `
                    <div class="project-meta">
                        <span class="genre">${item.genre || 'N/A'}</span>
                        <span class="word-count">${item.wordCount || 0} words</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                `;
            
            case 'brand':
                return `
                    <div class="project-meta">
                        <span class="client">Client: ${item.client || 'N/A'}</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                `;
            
            case 'github':
                return `
                    <div class="project-meta">
                        <span class="stars">⭐ ${item.stars || 0} stars</span>
                        <span class="forks">🍴 ${item.forks || 0} forks</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                `;
            
            default:
                return `<div class="project-meta"><span class="year">${item.year}</span></div>`;
        }
    }

    showProjectDetail(typeKey, projectId) {
        const container = document.getElementById('portfolio-container');
        if (!container) return;

        const typeData = this.projectTypes[typeKey];
        if (!typeData) return;

        let item = null;
        if (typeKey === 'blog') {
            item = typeData.posts?.find(post => post.id === projectId);
        } else {
            item = typeData.projects?.find(project => project.id === projectId);
        }

        if (!item) return;

        this.currentType = typeKey;
        this.currentProject = item;
        this.currentView = 'detail';

        container.innerHTML = `
            <div class="section-header">
                <button class="btn btn-secondary" data-action="back-to-list">
                    ← Back to ${typeData.title}
                </button>
                <h2>${item.title}</h2>
            </div>
            <div class="project-detail">
                ${this.renderProjectDetail(typeKey, item)}
            </div>
        `;

        this.updateURL('detail', typeKey, projectId);
    }

    renderProjectDetail(typeKey, item) {
        switch (typeKey) {
            case 'gallery':
                return this.renderGalleryDetail(item);
            
            case 'blog':
                return this.renderBlogDetail(item);
            
            case 'demo':
                return this.renderDemoDetail(item);
            
            case 'stories':
                return this.renderStoriesDetail(item);
            
            case 'brand':
                return this.renderBrandDetail(item);
            
            case 'github':
                return this.renderGithubDetail(item);
            
            default:
                return `<p>${item.description}</p>`;
        }
    }

    renderGalleryDetail(item) {
        return `
            <div class="gallery-detail">
                <div class="gallery-info">
                    <p class="description">${item.description}</p>
                    <div class="gallery-meta">
                        <span class="tags">Tags: ${item.tags ? item.tags.join(', ') : 'N/A'}</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div class="gallery-content">
                    <div class="gallery-description">
                        <p>${item.content}</p>
                    </div>
                    ${item.images && item.images.length > 0 ? `
                        <div class="gallery-grid">
                            ${item.images.map(image => `
                                <div class="gallery-item" onclick="portfolio.openLightbox('${image.src}', '${image.alt}', '${image.description}')">
                                    <img src="${image.src}" alt="${image.alt}">
                                    <div class="image-overlay">
                                        <h4>${image.alt}</h4>
                                        <p>${image.description}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p>No images available</p>'}
                </div>
            </div>
        `;
    }

    renderBlogDetail(item) {
        return `
            <div class="blog-detail">
                <div class="blog-header">
                    <div class="blog-meta">
                        <span class="author">By ${item.author}</span>
                        <span class="date">${new Date(item.date).toLocaleDateString()}</span>
                        <span class="read-time">${item.readTime}</span>
                        <span class="category">${item.category}</span>
                    </div>
                    <div class="blog-tags">
                        ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="blog-content">
                    ${this.parseMarkdown(item.content)}
                </div>
            </div>
        `;
    }

    renderDemoDetail(item) {
        return `
            <div class="demo-detail">
                <div class="demo-info">
                    <p class="description">${item.description}</p>
                    <div class="demo-meta">
                        <span class="technologies">${item.technologies ? item.technologies.join(', ') : 'N/A'}</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div class="demo-content">
                    <div class="demo-description">
                        <p>${item.content}</p>
                    </div>
                    <div class="demo-links">
                        ${item.liveUrl ? `
                            <a href="${item.liveUrl}" target="_blank" class="btn btn-primary">
                                View Live Demo
                            </a>
                        ` : ''}
                        ${item.githubUrl ? `
                            <a href="${item.githubUrl}" target="_blank" class="btn btn-secondary">
                                View on GitHub
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    renderStoriesDetail(item) {
        return '';
    }

    renderBrandDetail(item) {
        return `
            <div class="brand-detail">
                <div class="brand-info">
                    <p class="description">${item.description}</p>
                    <div class="brand-meta">
                        <span class="client">Client: ${item.client || 'N/A'}</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div class="brand-content">
                    <div class="brand-description">
                        <p>${item.content}</p>
                    </div>
                    ${item.services && item.services.length > 0 ? `
                        <div class="brand-services">
                            <h3>Services</h3>
                            <ul>
                                ${item.services.map(service => `<li>${service}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderGithubDetail(item) {
        return `
            <div class="github-detail">
                <div class="github-info">
                    <p class="description">${item.description}</p>
                    <div class="github-meta">
                        <span class="stars">⭐ ${item.stars || 0} stars</span>
                        <span class="forks">🍴 ${item.forks || 0} forks</span>
                        <span class="date">${item.date ? new Date(item.date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                </div>
                <div class="github-content">
                    <div class="github-description">
                        <p>${item.content}</p>
                    </div>
                    <div class="github-links">
                        ${item.githubUrl ? `
                            <a href="${item.githubUrl}" target="_blank" class="btn btn-primary">
                                View on GitHub
                            </a>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}