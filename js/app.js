// App.js - Main application initialization and coordination

class PortfolioApp {
    constructor() {
        this.isInitialized = false;
        this.performanceInterval = null;
        
        // Initialize immediately if DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    async init() {
        if (this.isInitialized) {
            console.log('App already initialized');
            return;
        }

        console.log('Initializing PortfolioApp...');
        
        // Wait for CSS to load
        await this.waitForCSS();
        
        // Setup the app
        this.setupApp();
        
        console.log('PortfolioApp initialization completed');
    }

    async waitForCSS() {
        return new Promise((resolve) => {
            // Check if all CSS files are loaded
            const checkCSS = () => {
                const stylesheets = document.styleSheets;
                let loadedCount = 0;
                
                for (let i = 0; i < stylesheets.length; i++) {
                    try {
                        if (stylesheets[i].href) {
                            loadedCount++;
                        }
                    } catch (e) {
                        // CORS restricted, count as loaded
                        loadedCount++;
                    }
                }
                
                console.log(`CSS files loaded: ${loadedCount}`);
                
                // Wait a bit more to ensure CSS is applied
                setTimeout(resolve, 100);
            };
            
            // Check immediately and after a short delay
            checkCSS();
        });
    }

    setupApp() {
        console.log('Setting up app...');
        
        // Show loading state
        utils.showLoading();
        
        // Initialize theme
        utils.initializeTheme();
        
        // Check if CSS is loaded
        this.checkCSSLoading();
        
        // Initialize components
        this.initializeComponents();
        
        // Setup error handling
        this.setupErrorHandling();
        
        // Monitor performance
        this.monitorPerformance();
        
        // Register service worker
        this.registerServiceWorker();
        
        // Setup PWA install prompt
        this.setupPWAInstallPrompt();
        
        // Setup connectivity handling
        this.setupConnectivityHandling();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Setup typing effect
        this.setupTypingEffect();
        
        // Initialize accordion navigation
        initializeAccordion();
        
        // Setup event listeners
        utils.addEventListeners();
        
        // Setup intersection observer for animations
        utils.setupIntersectionObserver();
        
        // Hide loading screen
        setTimeout(() => {
            utils.hideLoading();
            this.isInitialized = true;
        }, 1000);
        
        console.log('App setup completed');
    }

    checkCSSLoading() {
        // Check if CSS files are loaded
        const stylesheets = document.styleSheets;
        console.log('Loaded stylesheets:', stylesheets.length);
        
        for (let i = 0; i < stylesheets.length; i++) {
            try {
                const href = stylesheets[i].href;
                if (href) {
                    console.log(`Stylesheet ${i}: ${href}`);
                }
            } catch (e) {
                console.log(`Stylesheet ${i}: CORS restricted or inline`);
            }
        }
    }

    initializeComponents() {
        // Initialize portfolio manager
        if (typeof PortfolioManager !== 'undefined' && !window.portfolioManager) {
            this.portfolioManager = new PortfolioManager();
            window.portfolioManager = this.portfolioManager;
            console.log('PortfolioManager initialized from app.js');
        } else if (window.portfolioManager) {
            this.portfolioManager = window.portfolioManager;
            console.log('PortfolioManager already initialized, using existing instance');
        }

        // Initialize blog manager
        if (typeof BlogManager !== 'undefined' && !window.blogManager) {
            this.blogManager = new BlogManager();
            window.blogManager = this.blogManager;
            console.log('BlogManager initialized from app.js');
        } else if (window.blogManager) {
            this.blogManager = window.blogManager;
            console.log('BlogManager already initialized, using existing instance');
        }

        // Initialize AI chat
        if (typeof AIChat !== 'undefined') {
            this.aiChat = new AIChat();
        }

        // Setup global error handling
        this.setupErrorHandling();
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            utils.showError('An unexpected error occurred');
        });

        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            utils.showError('A network error occurred');
        });
    }

    monitorPerformance() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            try {
                // Monitor Largest Contentful Paint (LCP)
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    console.log('LCP:', lastEntry.startTime);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

                // Monitor First Input Delay (FID)
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        console.log('FID:', entry.processingStart - entry.startTime);
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });

                // Monitor Cumulative Layout Shift (CLS)
                const clsObserver = new PerformanceObserver((list) => {
                    let clsValue = 0;
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    console.log('CLS:', clsValue);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });

            } catch (error) {
                console.warn('Performance monitoring not supported:', error);
            }
        }
    }

    // Analytics tracking (placeholder for future implementation)
    trackEvent(eventName, properties = {}) {
        // Placeholder for analytics implementation
        console.log('Event tracked:', eventName, properties);
        
        // Example: Google Analytics 4
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', eventName, properties);
        // }
    }

    // SEO and meta tag management
    updateMetaTags(title, description, image) {
        // Update title
        if (title) {
            document.title = title;
        }

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription && description) {
            metaDescription.setAttribute('content', description);
        }

        // Update Open Graph tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle && title) {
            ogTitle.setAttribute('content', title);
        }

        const ogDescription = document.querySelector('meta[property="og:description"]');
        if (ogDescription && description) {
            ogDescription.setAttribute('content', description);
        }

        const ogImage = document.querySelector('meta[property="og:image"]');
        if (ogImage && image) {
            ogImage.setAttribute('content', image);
        }
    }

    // Service Worker registration for PWA capabilities
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);

                // Handle service worker updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available
                            this.showUpdateNotification();
                        }
                    });
                });

                // Handle service worker messages
                navigator.serviceWorker.addEventListener('message', (event) => {
                    if (event.data && event.data.type === 'CACHE_UPDATED') {
                        console.log('Cache updated:', event.data.urls);
                    }
                });

            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }

        // Setup PWA install prompt
        this.setupPWAInstallPrompt();
    }

    // Setup PWA install prompt
    setupPWAInstallPrompt() {
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show custom install prompt
            this.showInstallPrompt();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallPrompt();
            
            // Track installation
            this.trackEvent('pwa_installed');
        });
    }

    // Show PWA install prompt
    showInstallPrompt() {
        // Don't show if already shown recently
        if (localStorage.getItem('pwa_prompt_shown')) {
            return;
        }

        const prompt = document.createElement('div');
        prompt.className = 'pwa-install-prompt';
        prompt.innerHTML = `
            <div class="prompt-content">
                <h4>📱 Install Portfolio App</h4>
                <p>Add this portfolio to your home screen for quick access</p>
            </div>
            <div class="prompt-actions">
                <button onclick="this.parentElement.parentElement.remove()">Not now</button>
                <button class="primary" onclick="window.portfolioApp.installPWA()">Install</button>
            </div>
        `;

        document.body.appendChild(prompt);

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (prompt.parentElement) {
                prompt.remove();
            }
        }, 10000);
    }

    // Hide PWA install prompt
    hideInstallPrompt() {
        const prompt = document.querySelector('.pwa-install-prompt');
        if (prompt) {
            prompt.remove();
        }
    }

    // Install PWA
    async installPWA() {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            
            const { outcome } = await window.deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            
            window.deferredPrompt = null;
            this.hideInstallPrompt();
            
            // Mark as shown
            localStorage.setItem('pwa_prompt_shown', Date.now().toString());
        }
    }

    // Show update notification
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <span>🔄 New version available</span>
                <button onclick="this.parentElement.parentElement.remove()">Update</button>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    // Offline/online status handling
    setupConnectivityHandling() {
        // Show initial connection status
        if (!navigator.onLine) {
            this.showOfflineStatus();
        }

        window.addEventListener('online', () => {
            this.hideOfflineStatus();
            utils.showSuccess('Connection restored');
            
            // Sync any offline data
            this.syncOfflineData();
        });

        window.addEventListener('offline', () => {
            this.showOfflineStatus();
            utils.showError('You are currently offline');
        });
    }

    // Show offline status indicator
    showOfflineStatus() {
        let indicator = document.getElementById('offline-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.innerHTML = `
                <div class="offline-status">
                    <span class="offline-dot"></span>
                    <span>Offline</span>
                </div>
            `;
            indicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ff6b6b;
                color: white;
                text-align: center;
                padding: 8px;
                font-size: 14px;
                z-index: 10000;
                animation: slideDown 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }
    }

    // Hide offline status indicator
    hideOfflineStatus() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => indicator.remove(), 300);
        }
    }

    // Sync offline data when connection is restored
    async syncOfflineData() {
        try {
            // Check for offline form submissions
            const offlineForms = await this.getOfflineForms();
            if (offlineForms.length > 0) {
                for (const formData of offlineForms) {
                    await this.submitOfflineForm(formData);
                }
                utils.showSuccess('Offline data synced successfully');
            }
        } catch (error) {
            console.error('Error syncing offline data:', error);
        }
    }

    // Get stored offline forms
    async getOfflineForms() {
        if ('indexedDB' in window) {
            try {
                const db = await this.openIndexedDB();
                const transaction = db.transaction(['offlineForms'], 'readonly');
                const store = transaction.objectStore('offlineForms');
                return await store.getAll();
            } catch (error) {
                console.error('Error getting offline forms:', error);
                return [];
            }
        }
        return [];
    }

    // Submit offline form
    async submitOfflineForm(formData) {
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Remove from offline storage
                await this.removeOfflineForm(formData.id);
                return true;
            }
        } catch (error) {
            console.error('Error submitting offline form:', error);
            return false;
        }
    }

    // Remove offline form from storage
    async removeOfflineForm(id) {
        if ('indexedDB' in window) {
            try {
                const db = await this.openIndexedDB();
                const transaction = db.transaction(['offlineForms'], 'readwrite');
                const store = transaction.objectStore('offlineForms');
                await store.delete(id);
            } catch (error) {
                console.error('Error removing offline form:', error);
            }
        }
    }

    // Open IndexedDB
    openIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('PortfolioDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('offlineForms')) {
                    db.createObjectStore('offlineForms', { keyPath: 'id' });
                }
            };
        });
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to toggle AI chat
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (this.aiChat) {
                    this.aiChat.toggle();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                if (this.portfolioManager) {
                    this.portfolioManager.closeModal();
                }
                if (this.aiChat && this.aiChat.isOpen) {
                    this.aiChat.toggle();
                }
            }

            // Ctrl/Cmd + / for help
            if ((e.ctrlKey || e.metaKey) && e.key === '/') {
                e.preventDefault();
                this.showHelp();
            }
        });
    }

    showHelp() {
        const helpContent = `
            <div style="max-width: 600px; margin: 0 auto;">
                <h3>Keyboard Shortcuts</h3>
                <ul style="line-height: 2;">
                    <li><strong>Ctrl/Cmd + K:</strong> Toggle AI assistant</li>
                    <li><strong>Escape:</strong> Close modals and dialogs</li>
                    <li><strong>Ctrl/Cmd + /:</strong> Show this help</li>
                </ul>
                
                <h3>Navigation</h3>
                <ul style="line-height: 2;">
                    <li>Use the navigation menu to jump between sections</li>
                    <li>Click on portfolio items to view detailed information</li>
                    <li>Use the AI assistant for guided exploration</li>
                </ul>
                
                <h3>Accessibility</h3>
                <ul style="line-height: 2;">
                    <li>All interactive elements support keyboard navigation</li>
                    <li>Screen reader friendly with proper ARIA labels</li>
                    <li>High contrast mode support</li>
                    <li>Reduced motion support for animations</li>
                </ul>
            </div>
        `;

        if (this.portfolioManager) {
            this.portfolioManager.openModal('Help & Keyboard Shortcuts', helpContent);
        }
    }

    // Cleanup and teardown
    destroy() {
        // Remove event listeners
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('unhandledrejection', this.handleRejection);

        // Clear any intervals or timeouts
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }

        this.isInitialized = false;
    }

    // Setup typing effect for hero title
    setupTypingEffect() {
        const heroTitle = document.querySelector('.hero h1');
        if (!heroTitle) return;

        const originalText = heroTitle.textContent;
        heroTitle.textContent = '';
        
        // Start typing effect after a short delay
        setTimeout(() => {
            if (animationManager && animationManager.typeWriter) {
                animationManager.typeWriter(heroTitle, originalText, 80);
            } else {
                // Fallback if animation manager isn't available
                heroTitle.textContent = originalText;
            }
        }, 500);
    }
}

// Initialize the application
let app;

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new PortfolioApp();
    });
} else {
    app = new PortfolioApp();
}

// Export for global access
window.app = app;

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
    }
});

// Handle beforeunload for cleanup
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// Accordion Navigation System
function initializeAccordion() {
    console.log('App.js: Initializing accordion navigation...');
    
    // Handle accordion header and nav link clicks using event delegation
    document.addEventListener('click', function(event) {
        // Don't handle clicks on modal elements
        if (event.target.closest('.modal') || event.target.closest('.modal-content')) {
            return;
        }
        // Don't handle clicks on form elements
        if (event.target.closest('form') || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA' || event.target.tagName === 'BUTTON') {
            return;
        }
        const accordionHeader = event.target.closest('.accordion-header');
        const navLink = event.target.closest('[data-section]');
        if (accordionHeader) {
            const section = accordionHeader.getAttribute('data-section');
            console.log('Accordion header clicked:', section);
            toggleAccordionSection(section);
        } else if (navLink && navLink.hasAttribute('data-section')) {
            event.preventDefault();
            const section = navLink.getAttribute('data-section');
            console.log('Nav link clicked:', section);
            toggleAccordionSection(section);
        }
    });
    
    // Handle URL hash changes for deep navigation
    window.addEventListener('hashchange', handleHashChange);
    window.addEventListener('popstate', handleHashChange);
    // Handle initial URL hash
    handleHashChange();
    console.log('App.js: Accordion navigation initialized');
}

function toggleAccordionSection(sectionId) {
    console.log('App.js: Toggling accordion section:', sectionId);
    
    const allSections = document.querySelectorAll('.accordion-section');
    const targetSection = document.getElementById(sectionId);
    
    console.log('Found sections:', allSections.length, 'Target section:', targetSection);
    
    if (!targetSection) {
        console.warn('App.js: Section not found:', sectionId);
        return;
    }
    
    // Close all sections
    allSections.forEach(section => {
        section.classList.remove('active');
        const icon = section.querySelector('.accordion-icon');
        if (icon) icon.textContent = '▶';
        console.log('Closed section:', section.id);
    });
    
    // Open target section
    targetSection.classList.add('active');
    const targetIcon = targetSection.querySelector('.accordion-icon');
    if (targetIcon) targetIcon.textContent = '▼';
    console.log('Opened section:', sectionId);
    
    // Update URL without hash for accordion sections
    if (sectionId !== 'portfolio') {
        // For non-portfolio sections, just update the accordion state
        history.replaceState({ section: sectionId }, '', '/');
    }
    
    // Special handling for portfolio section
    if (sectionId === 'portfolio') {
        // Let the portfolio manager handle its own navigation
        // The portfolio section will be expanded, but deep navigation will still work
        if (window.portfolioManager) {
            // If we're in a deep navigation state, let the portfolio manager handle it
            const path = window.location.pathname;
            if (path !== '/' && path !== '') {
                const pathParts = path.split('/').filter(part => part);
                if (pathParts.length >= 1) {
                    // Let the portfolio manager handle the navigation
                    setTimeout(() => {
                        if (pathParts.length === 1) {
                            window.portfolioManager.showProjectList(pathParts[0]);
                        } else if (pathParts.length === 2) {
                            window.portfolioManager.showProjectDetail(pathParts[0], pathParts[1]);
                        }
                    }, 100);
                }
            }
        }
    }
    
    // Scroll to the section smoothly
    setTimeout(() => {
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);
    const path = window.location.pathname;
    
    // If there's a hash, it's likely for deep portfolio navigation
    if (hash && (hash === 'portfolio' || hash === 'work')) {
        toggleAccordionSection('portfolio');
        return;
    }
    
    // If there's a path with portfolio navigation, expand portfolio section
    if (path !== '/' && path !== '') {
        const pathParts = path.split('/').filter(part => part);
        if (pathParts.length >= 1) {
            // This is portfolio deep navigation
            toggleAccordionSection('portfolio');
            return;
        }
    }
    
    // Default to home if no specific navigation
    if (!hash && path === '/') {
        toggleAccordionSection('home');
    }
}

// Export functions for global access
window.toggleTheme = toggleTheme;
window.installPWA = function() {
    if (app && app.installPWA) {
        return app.installPWA();
    }
};
window.hideInstallPrompt = function() {
    if (app && app.hideInstallPrompt) {
        return app.hideInstallPrompt();
    }
};
window.toggleAccordionSection = toggleAccordionSection; 