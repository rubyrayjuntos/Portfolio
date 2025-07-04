// Blog Manager - Handle blog functionality
// Version: 1.3 - Fixed initialization timing issue

console.log('BlogManager: Loading version 1.3 with initialization fix...');

class BlogManager {
    constructor() {
        console.log('BlogManager: Constructor called');
        this.posts = [];
        this.categories = [];
        this.tags = [];
        this.currentFilter = null;
        this.searchTerm = '';
        this.currentPage = 1;
        this.postsPerPage = 6;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('BlogManager: Starting initialization...');
        try {
            await this.loadBlogData();
            console.log('BlogManager: Blog data loaded, calling setupEventListeners...');
            this.setupEventListeners();
            console.log('BlogManager: Event listeners setup, setting isInitialized to true...');
            this.isInitialized = true;
            console.log('BlogManager: Calling renderBlog...');
            this.renderBlog();
            console.log('BlogManager: Initialization completed successfully');
        } catch (error) {
            console.error('BlogManager: Failed to initialize blog:', error);
            this.showError('Failed to load blog posts');
        }
    }

    async loadBlogData() {
        console.log('BlogManager: Starting loadBlogData...');
        try {
            const response = await fetch('/data/blog-posts.json');
            console.log('BlogManager: Fetch response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('BlogManager: Raw JSON data received:', data);
            console.log('BlogManager: Data type:', typeof data);
            console.log('BlogManager: Data keys:', Object.keys(data));
            
            this.posts = data.posts || [];
            this.categories = data.categories || [];
            this.tags = data.tags || [];
            
            console.log('BlogManager: Posts loaded:', this.posts.length);
            console.log('BlogManager: Categories loaded:', this.categories.length);
            console.log('BlogManager: Tags loaded:', this.tags.length);
            console.log('BlogManager: First post sample:', this.posts[0]);
            
        } catch (error) {
            console.error('BlogManager: Error loading blog data:', error);
            console.log('BlogManager: Using fallback data');
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        this.posts = [
            {
                id: 'sample-post',
                title: 'Sample Blog Post',
                excerpt: 'This is a sample blog post to demonstrate the blog functionality.',
                content: '# Sample Post\n\nThis is a sample blog post with **markdown** support.\n\n## Features\n\n- Markdown parsing\n- Syntax highlighting\n- Responsive design\n- Search functionality',
                author: 'Creative Developer',
                date: '2024-01-01',
                readTime: '3 min read',
                category: 'General',
                tags: ['sample', 'demo'],
                featured: true,
                coverImage: '/assets/images/blog/sample-cover.jpg',
                slug: 'sample-post'
            }
        ];
        
        this.categories = [
            {
                name: 'General',
                slug: 'general',
                description: 'General blog posts',
                postCount: 1
            }
        ];
        
        this.tags = ['sample', 'demo'];
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.category-filter')) {
                e.preventDefault();
                const category = e.target.getAttribute('data-category');
                this.filterByCategory(category);
            }
            
            if (e.target.matches('.tag-filter')) {
                e.preventDefault();
                const tag = e.target.getAttribute('data-tag');
                this.filterByTag(tag);
            }
            
            if (e.target.matches('.clear-filters')) {
                this.clearFilters();
            }
        });

        const searchInput = document.getElementById('blog-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.renderBlog();
            });
        }
    }

    filterByCategory(category) {
        this.currentFilter = { type: 'category', value: category };
        this.currentPage = 1;
        this.renderBlog();
        this.updateActiveFilterUI();
    }

    filterByTag(tag) {
        this.currentFilter = { type: 'tag', value: tag };
        this.currentPage = 1;
        this.renderBlog();
        this.updateActiveFilterUI();
    }

    clearFilters() {
        this.currentFilter = null;
        this.searchTerm = '';
        this.currentPage = 1;
        this.renderBlog();
        this.updateActiveFilterUI();
    }

    updateActiveFilterUI() {
        document.querySelectorAll('.category-filter, .tag-filter').forEach(btn => {
            btn.classList.remove('active');
        });

        if (this.currentFilter?.type === 'category') {
            document.querySelector(`[data-category="${this.currentFilter.value}"]`)?.classList.add('active');
        } else if (this.currentFilter?.type === 'tag') {
            document.querySelector(`[data-tag="${this.currentFilter.value}"]`)?.classList.add('active');
        }
    }

    getFilteredPosts() {
        let filtered = [...this.posts];

        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(term) ||
                post.excerpt.toLowerCase().includes(term) ||
                post.content.toLowerCase().includes(term) ||
                post.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }

        if (this.currentFilter) {
            if (this.currentFilter.type === 'category') {
                filtered = filtered.filter(post => post.category === this.currentFilter.value);
            } else if (this.currentFilter.type === 'tag') {
                filtered = filtered.filter(post => post.tags.includes(this.currentFilter.value));
            }
        }

        return filtered;
    }

    getPaginatedPosts(posts) {
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const endIndex = startIndex + this.postsPerPage;
        return posts.slice(startIndex, endIndex);
    }

    renderBlog() {
        console.log('BlogManager: renderBlog called');
        const blogContainer = document.getElementById('blog-container');
        console.log('BlogManager: Blog container found:', blogContainer);
        
        if (!blogContainer) {
            console.error('BlogManager: Blog container not found!');
            console.log('BlogManager: Available elements with "blog" in ID:');
            document.querySelectorAll('[id*="blog"]').forEach(el => {
                console.log('  -', el.id, el.tagName, el.className);
            });
            return;
        }

        console.log('BlogManager: Blog container details:', {
            id: blogContainer.id,
            className: blogContainer.className,
            childrenCount: blogContainer.children.length,
            innerHTML: blogContainer.innerHTML.substring(0, 100) + '...'
        });

        const filteredPosts = this.getFilteredPosts();
        const paginatedPosts = this.getPaginatedPosts(filteredPosts);
        
        console.log('BlogManager: Filtered posts:', filteredPosts.length);
        console.log('BlogManager: Paginated posts:', paginatedPosts.length);

        if (!this.isInitialized) {
            console.log('BlogManager: Not initialized, showing loading...');
            blogContainer.innerHTML = this.getLoadingHTML();
            return;
        }

        console.log('BlogManager: Rendering blog content...');
        blogContainer.innerHTML = `
            <div class="blog-header">
                <h1>Blog</h1>
                <p>Thoughts on creativity, technology, and the intersection of both</p>
            </div>
            
            <div class="blog-filters">
                ${this.renderSearchBar()}
                ${this.renderCategoryFilters()}
                ${this.renderTagFilters()}
                ${this.renderClearFilters()}
            </div>
            
            <div class="blog-content">
                ${this.renderPosts(paginatedPosts)}
                ${this.renderPagination(filteredPosts)}
            </div>
        `;

        console.log('BlogManager: Blog content rendered');
        console.log('BlogManager: Final blog container children count:', blogContainer.children.length);

        this.updateActiveFilterUI();
    }

    renderSearchBar() {
        return `
            <div class="search-container">
                <input type="text" id="blog-search" placeholder="Search posts..." value="${this.searchTerm}">
                <span class="search-icon">🔍</span>
            </div>
        `;
    }

    renderCategoryFilters() {
        if (this.categories.length === 0) return '';

        return `
            <div class="filter-section">
                <h3>Categories</h3>
                <div class="filter-buttons">
                    ${this.categories.map(category => `
                        <button class="category-filter" data-category="${category.name}">
                            ${category.name} (${category.postCount})
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderTagFilters() {
        if (this.tags.length === 0) return '';

        return `
            <div class="filter-section">
                <h3>Tags</h3>
                <div class="filter-buttons">
                    ${this.tags.map(tag => `
                        <button class="tag-filter" data-tag="${tag}">
                            #${tag}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderClearFilters() {
        if (!this.currentFilter && !this.searchTerm) return '';

        return `
            <div class="filter-section">
                <button class="clear-filters">Clear All Filters</button>
            </div>
        `;
    }

    renderPosts(posts) {
        if (posts.length === 0) {
            return `
                <div class="no-posts">
                    <h3>No posts found</h3>
                    <p>Try adjusting your search or filters to find what you're looking for.</p>
                </div>
            `;
        }

        return `
            <div class="blog-grid">
                ${posts.map(post => this.renderPostCard(post)).join('')}
            </div>
        `;
    }

    renderPostCard(post) {
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        return `
            <article class="blog-card" data-post-id="${post.id}">
                <div class="blog-card-image">
                    <img src="${post.coverImage}" alt="${post.title}" onerror="this.src='/assets/images/blog/default-cover.jpg'">
                    ${post.featured ? '<span class="featured-badge">Featured</span>' : ''}
                </div>
                <div class="blog-card-content">
                    <div class="blog-card-meta">
                        <span class="blog-category">${post.category}</span>
                        <span class="blog-date">${date}</span>
                        <span class="blog-read-time">${post.readTime}</span>
                    </div>
                    <h2 class="blog-card-title">${post.title}</h2>
                    <p class="blog-card-excerpt">${post.excerpt}</p>
                    <div class="blog-card-tags">
                        ${post.tags.map(tag => `<span class="blog-tag">#${tag}</span>`).join('')}
                    </div>
                    <button class="read-more-btn" onclick="blogManager.openPost('${post.slug}')">
                        Read More →
                    </button>
                </div>
            </article>
        `;
    }

    renderPagination(filteredPosts) {
        const totalPages = Math.ceil(filteredPosts.length / this.postsPerPage);
        if (totalPages <= 1) return '';

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }

        return `
            <div class="pagination">
                ${this.currentPage > 1 ? `
                    <button class="pagination-btn" onclick="blogManager.goToPage(${this.currentPage - 1})">
                        ← Previous
                    </button>
                ` : ''}
                
                ${pages.map(page => `
                    <button class="pagination-btn ${page === this.currentPage ? 'active' : ''}" 
                            onclick="blogManager.goToPage(${page})">
                        ${page}
                    </button>
                `).join('')}
                
                ${this.currentPage < totalPages ? `
                    <button class="pagination-btn" onclick="blogManager.goToPage(${this.currentPage + 1})">
                        Next →
                    </button>
                ` : ''}
            </div>
        `;
    }

    goToPage(page) {
        this.currentPage = page;
        this.renderBlog();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    openPost(slug) {
        const post = this.posts.find(p => p.slug === slug);
        if (!post) {
            this.showError('Post not found');
            return;
        }

        this.showPostModal(post);
    }

    showPostModal(post) {
        const modal = document.createElement('div');
        modal.className = 'blog-modal modal';
        modal.innerHTML = `
            <div class="modal-content blog-modal-content">
                <div class="modal-header">
                    <button class="modal-close" onclick="this.closest('.blog-modal').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    ${this.renderFullPost(post)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('active'), 10);
    }

    renderFullPost(post) {
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const parsedContent = markdownParser.parse(post.content);
        const toc = markdownParser.generateTOC(markdownParser.extractTOC(post.content));

        return `
            <article class="blog-post">
                <header class="blog-post-header">
                    <div class="blog-post-meta">
                        <span class="blog-category">${post.category}</span>
                        <span class="blog-date">${date}</span>
                        <span class="blog-read-time">${post.readTime}</span>
                        <span class="blog-author">By ${post.author}</span>
                    </div>
                    <h1 class="blog-post-title">${post.title}</h1>
                    <p class="blog-post-excerpt">${post.excerpt}</p>
                    <div class="blog-post-tags">
                        ${post.tags.map(tag => `<span class="blog-tag">#${tag}</span>`).join('')}
                    </div>
                </header>
                
                <div class="blog-post-content">
                    ${toc}
                    <div class="blog-post-body">
                        ${parsedContent}
                    </div>
                </div>
                
                <footer class="blog-post-footer">
                    <div class="blog-post-share">
                        <h4>Share this post:</h4>
                        <div class="share-buttons">
                            <button onclick="blogManager.sharePost('${post.slug}', 'twitter')">Twitter</button>
                            <button onclick="blogManager.sharePost('${post.slug}', 'linkedin')">LinkedIn</button>
                            <button onclick="blogManager.sharePost('${post.slug}', 'copy')">Copy Link</button>
                        </div>
                    </div>
                </footer>
            </article>
        `;
    }

    sharePost(slug, platform) {
        const post = this.posts.find(p => p.slug === slug);
        if (!post) return;

        const url = `${window.location.origin}/blog/${slug}`;
        const text = `Check out this post: ${post.title}`;

        switch (platform) {
            case 'twitter':
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
                break;
            case 'linkedin':
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
                break;
            case 'copy':
                navigator.clipboard.writeText(url).then(() => {
                    this.showSuccess('Link copied to clipboard!');
                });
                break;
        }
    }

    getLoadingHTML() {
        return `
            <div class="blog-loading">
                <div class="loading-spinner"></div>
                <p>Loading blog posts...</p>
            </div>
        `;
    }

    showError(message) {
        utils.showError(message);
    }

    showSuccess(message) {
        utils.showSuccess(message);
    }
}

// Initialize blog manager
let blogManager;

document.addEventListener('DOMContentLoaded', () => {
    blogManager = new BlogManager();
});

// Export for global access
window.blogManager = blogManager;
