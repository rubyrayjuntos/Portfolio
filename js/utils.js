// Utils.js - Helper functions and utilities

console.log('=== UTILS.JS LOADED ===');
console.log('Utils.js file is being executed');

// Theme management
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    
    // Save to localStorage
    localStorage.setItem('theme', newTheme);
}

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.body.setAttribute('data-theme', 'dark');
    }
}

// Loading state management
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.remove('hidden');
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.classList.add('hidden');
        // Force remove after animation
        setTimeout(() => {
            loading.style.display = 'none';
            console.log('Loading screen hidden');
        }, 300);
    }
}

// Error handling
function showError(message, duration = 5000) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, duration);
}

function showSuccess(message, duration = 5000) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, duration);
}

// Smooth scrolling
function smoothScrollTo(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// File utilities
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

function validateImageFile(file) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
    }
    
    if (file.size > maxSize) {
        throw new Error('Image file size must be less than 5MB');
    }
    
    return true;
}

// DOM utilities
function createElement(tag, className, textContent = '') {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (textContent) {
        element.textContent = textContent;
    }
    return element;
}

function addClass(element, className) {
    if (element && element.classList) {
        element.classList.add(className);
    }
}

function removeClass(element, className) {
    if (element && element.classList) {
        element.classList.remove(className);
    }
}

function toggleClass(element, className) {
    if (element && element.classList) {
        element.classList.toggle(className);
    }
}

// Event utilities
function addEventListeners() {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            smoothScrollTo(targetId);
        });
    });

    // Header scroll effect
    const header = document.querySelector('header');
    if (header) {
        window.addEventListener('scroll', throttle(() => {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(15, 23, 42, 0.95)';
            } else {
                header.style.background = 'var(--glass)';
            }
        }, 100));
    }

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmit);
    }
}

// Contact form handler
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        id: Date.now().toString(), // Unique ID for offline storage
        name: formData.get('name'),
        email: formData.get('email'),
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };
    
    // Basic validation
    if (!data.name || !data.email || !data.message) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!isValidEmail(data.email)) {
        showError('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;
    
    try {
        // Check if online
        if (navigator.onLine) {
            // Try to send immediately
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                showSuccess('Message sent successfully! I\'ll get back to you soon.');
                e.target.reset();
            } else {
                throw new Error('Server error');
            }
        } else {
            // Store for offline sync
            await storeOfflineForm(data);
            showOfflineFormIndicator(e.target);
            showSuccess('Message saved for offline delivery. Will send when connection is restored.');
            e.target.reset();
        }
    } catch (error) {
        console.error('Contact form error:', error);
        
        // If online but failed, try to store for later
        if (navigator.onLine) {
            try {
                await storeOfflineForm(data);
                showOfflineFormIndicator(e.target);
                showSuccess('Message saved for offline delivery. Will send when connection is restored.');
                e.target.reset();
            } catch (storageError) {
                showError('Failed to send message. Please try again when online.');
            }
        } else {
            showError('Failed to save message. Please try again when online.');
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Store form data for offline sync
async function storeOfflineForm(formData) {
    if ('indexedDB' in window) {
        try {
            const db = await openIndexedDB();
            const transaction = db.transaction(['offlineForms'], 'readwrite');
            const store = transaction.objectStore('offlineForms');
            await store.put(formData);
            
            // Register background sync if available
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                const registration = await navigator.serviceWorker.ready;
                await registration.sync.register('contact-form-sync');
            }
        } catch (error) {
            console.error('Error storing offline form:', error);
            throw error;
        }
    } else {
        // Fallback to localStorage
        const offlineForms = JSON.parse(localStorage.getItem('offlineForms') || '[]');
        offlineForms.push(formData);
        localStorage.setItem('offlineForms', JSON.stringify(offlineForms));
    }
}

// Show offline form indicator
function showOfflineFormIndicator(form) {
    let indicator = form.querySelector('.offline-form-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'offline-form-indicator';
        indicator.textContent = 'Message saved for offline delivery';
        form.appendChild(indicator);
    }
}

// Open IndexedDB
function openIndexedDB() {
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

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Intersection Observer for animations
function setupIntersectionObserver() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    document.querySelectorAll('.portfolio-item, .skill-category, .story-card').forEach(el => {
        observer.observe(el);
    });
}

// Performance monitoring
function measurePerformance(label, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${label}: ${(end - start).toFixed(2)}ms`);
    return result;
}

// Local storage utilities
const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error writing to localStorage:', error);
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
};

// HTML sanitization to prevent XSS
function sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function sanitizeAttribute(str) {
    if (typeof str !== 'string') return str;
    
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Safe DOM manipulation
function createSafeElement(tag, className = '', textContent = '') {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (textContent) {
        element.textContent = textContent; // Use textContent instead of innerHTML
    }
    return element;
}

function setSafeInnerHTML(element, html) {
    // Only allow safe HTML tags and attributes
    const allowedTags = ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'code', 'pre'];
    const allowedAttributes = ['href', 'target', 'rel', 'class', 'id'];
    
    // Create a temporary div to parse the HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Recursively sanitize the content
    function sanitizeNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent;
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const tagName = node.tagName.toLowerCase();
            
            // Only allow safe tags
            if (!allowedTags.includes(tagName)) {
                return node.textContent;
            }
            
            // Create new element
            const newElement = document.createElement(tagName);
            
            // Copy safe attributes
            for (let attr of node.attributes) {
                if (allowedAttributes.includes(attr.name.toLowerCase())) {
                    if (attr.name.toLowerCase() === 'href') {
                        // Validate URLs
                        const url = attr.value;
                        if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:') || url.startsWith('tel:')) {
                            newElement.setAttribute(attr.name, sanitizeAttribute(attr.value));
                        }
                    } else {
                        newElement.setAttribute(attr.name, sanitizeAttribute(attr.value));
                    }
                }
            }
            
            // Process child nodes
            for (let child of node.childNodes) {
                const sanitizedChild = sanitizeNode(child);
                if (typeof sanitizedChild === 'string') {
                    newElement.appendChild(document.createTextNode(sanitizedChild));
                } else {
                    newElement.appendChild(sanitizedChild);
                }
            }
            
            return newElement;
        }
        
        return '';
    }
    
    // Clear the element and add sanitized content
    element.innerHTML = '';
    for (let child of temp.childNodes) {
        const sanitizedChild = sanitizeNode(child);
        if (typeof sanitizedChild === 'string') {
            element.appendChild(document.createTextNode(sanitizedChild));
        } else {
            element.appendChild(sanitizedChild);
        }
    }
}

// Image optimization utilities
class ImageOptimizer {
    constructor() {
        this.supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.quality = 0.8; // 80% quality for compression
        this.maxWidth = 1920; // Max width for large images
        this.thumbnailSize = 300; // Thumbnail size
    }

    async optimizeImage(file) {
        try {
            // Validate file
            if (!this.supportedFormats.includes(file.type)) {
                throw new Error('Unsupported image format. Please use JPEG, PNG, WebP, or GIF.');
            }

            if (file.size > this.maxFileSize) {
                throw new Error('Image file size must be less than 5MB.');
            }

            // Create canvas for processing
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // Calculate new dimensions
                        const { width, height } = this.calculateDimensions(img.width, img.height);
                        
                        // Set canvas size
                        canvas.width = width;
                        canvas.height = height;

                        // Draw and compress image
                        ctx.drawImage(img, 0, 0, width, height);

                        // Convert to WebP if supported, otherwise use original format
                        const format = this.isWebPSupported() ? 'image/webp' : file.type;
                        const quality = format === 'image/webp' ? 0.85 : this.quality;

                        canvas.toBlob((blob) => {
                            if (blob) {
                                const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                                    type: format,
                                    lastModified: Date.now()
                                });

                                resolve({
                                    original: {
                                        file: file,
                                        size: file.size,
                                        src: URL.createObjectURL(file)
                                    },
                                    optimized: {
                                        file: optimizedFile,
                                        size: optimizedFile.size,
                                        src: URL.createObjectURL(optimizedFile),
                                        format: format,
                                        dimensions: { width, height }
                                    },
                                    compression: {
                                        originalSize: file.size,
                                        optimizedSize: optimizedFile.size,
                                        compressionRatio: ((file.size - optimizedFile.size) / file.size * 100).toFixed(1)
                                    }
                                });
                            } else {
                                reject(new Error('Failed to optimize image'));
                            }
                        }, format, quality);
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = URL.createObjectURL(file);
            });
        } catch (error) {
            throw error;
        }
    }

    calculateDimensions(originalWidth, originalHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };

        // Scale down if too large
        if (width > this.maxWidth) {
            const ratio = this.maxWidth / width;
            width = this.maxWidth;
            height = Math.round(height * ratio);
        }

        return { width, height };
    }

    isWebPSupported() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    async generateThumbnail(file, size = 300) {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            return new Promise((resolve, reject) => {
                img.onload = () => {
                    try {
                        // Calculate thumbnail dimensions (maintain aspect ratio)
                        const { width, height } = this.calculateThumbnailDimensions(img.width, img.height, size);
                        
                        canvas.width = width;
                        canvas.height = height;

                        // Draw thumbnail
                        ctx.drawImage(img, 0, 0, width, height);

                        canvas.toBlob((blob) => {
                            if (blob) {
                                const thumbnailFile = new File([blob], `thumb_${file.name}`, {
                                    type: 'image/webp',
                                    lastModified: Date.now()
                                });

                                resolve({
                                    file: thumbnailFile,
                                    src: URL.createObjectURL(thumbnailFile),
                                    dimensions: { width, height }
                                });
                            } else {
                                reject(new Error('Failed to generate thumbnail'));
                            }
                        }, 'image/webp', 0.8);
                    } catch (error) {
                        reject(error);
                    }
                };

                img.onerror = () => reject(new Error('Failed to load image for thumbnail'));
                img.src = URL.createObjectURL(file);
            });
        } catch (error) {
            throw error;
        }
    }

    calculateThumbnailDimensions(originalWidth, originalHeight, maxSize) {
        const ratio = Math.min(maxSize / originalWidth, maxSize / originalHeight);
        return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
        };
    }

    async uploadImage(file) {
        try {
            // Optimize the image first
            const optimized = await this.optimizeImage(file);
            
            // Generate thumbnail
            const thumbnail = await this.generateThumbnail(file, this.thumbnailSize);

            // Upload the optimized image to server
            const formData = new FormData();
            formData.append('image', optimized.optimized.file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const uploadResult = await response.json();
            
            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            // Upload thumbnail if needed
            let thumbnailUrl = thumbnail.src;
            if (thumbnail.file.size > 50000) { // Only upload if thumbnail is larger than 50KB
                const thumbnailFormData = new FormData();
                thumbnailFormData.append('image', thumbnail.file);
                
                const thumbnailResponse = await fetch('/api/upload/image', {
                    method: 'POST',
                    body: thumbnailFormData,
                    credentials: 'include'
                });
                
                if (thumbnailResponse.ok) {
                    const thumbnailResult = await thumbnailResponse.json();
                    thumbnailUrl = thumbnailResult.file.url;
                }
            }

            return {
                original: {
                    file: file,
                    size: file.size,
                    src: URL.createObjectURL(file) // Keep original for preview
                },
                optimized: {
                    file: optimized.optimized.file,
                    size: optimized.optimized.size,
                    src: uploadResult.file.url, // Use server URL
                    format: optimized.optimized.format,
                    dimensions: optimized.optimized.dimensions
                },
                thumbnail: {
                    file: thumbnail.file,
                    src: thumbnailUrl,
                    dimensions: thumbnail.dimensions
                },
                compression: optimized.compression,
                serverInfo: uploadResult.file
            };
        } catch (error) {
            console.error('Image upload error:', error);
            throw error;
        }
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    setupLazyLoading() {
        // Use Intersection Observer for lazy loading
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                    }
                });
            });

            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        } else {
            // Fallback for older browsers
            document.querySelectorAll('img[data-src]').forEach(img => {
                img.src = img.dataset.src;
                img.classList.remove('lazy');
            });
        }
    }
}

// Create global instance
const imageOptimizer = new ImageOptimizer();

// Logging system
class Logger {
    constructor() {
        this.isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        this.logLevel = this.isProduction ? 'error' : 'debug'; // Only errors in production
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    error(message, ...args) {
        if (this.shouldLog('error')) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }

    warn(message, ...args) {
        if (this.shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    info(message, ...args) {
        if (this.shouldLog('info')) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    debug(message, ...args) {
        if (this.shouldLog('debug')) {
            console.log(`[DEBUG] ${message}`, ...args);
        }
    }

    // Performance logging
    time(label) {
        if (this.shouldLog('debug')) {
            console.time(`[PERF] ${label}`);
        }
    }

    timeEnd(label) {
        if (this.shouldLog('debug')) {
            console.timeEnd(`[PERF] ${label}`);
        }
    }

    // Error tracking for production
    trackError(error, context = {}) {
        this.error(`Error in ${context.component || 'unknown'}:`, error);
        
        // In production, you might want to send this to an error tracking service
        if (this.isProduction && typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false,
                custom_map: context
            });
        }
    }
}

// Create global logger instance
const logger = new Logger();

// Export utilities for use in other modules
window.utils = {
    toggleTheme,
    initializeTheme,
    showLoading,
    hideLoading,
    showError,
    showSuccess,
    smoothScrollTo,
    debounce,
    throttle,
    fileToBase64,
    validateImageFile,
    createElement,
    addClass,
    removeClass,
    toggleClass,
    addEventListeners,
    setupIntersectionObserver,
    measurePerformance,
    storage
};

// Error handling and user feedback system
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
    }

    handleError(error, context = {}) {
        // Log error
        this.logError(error, context);
        
        // Show user-friendly message
        this.showUserError(error, context);
        
        // Report to analytics if available
        this.reportError(error, context);
    }

    logError(error, context) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error.message || 'Unknown error',
            stack: error.stack,
            name: error.name,
            context: context
        };

        this.errorLog.push(errorEntry);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Log to console with proper formatting
        console.error('Error logged:', {
            message: errorEntry.message,
            name: errorEntry.name,
            context: errorEntry.context,
            timestamp: errorEntry.timestamp
        });
    }

    showUserError(error, context) {
        let userMessage = 'Something went wrong. Please try again.';
        
        // Provide specific messages for common errors
        if (error.name === 'NetworkError' || error.message.includes('fetch')) {
            userMessage = 'Network error. Please check your connection and try again.';
        } else if (error.name === 'TypeError' && error.message.includes('JSON')) {
            userMessage = 'Data format error. Please refresh the page.';
        } else if (error.message.includes('404')) {
            userMessage = 'The requested resource was not found.';
        } else if (error.message.includes('403')) {
            userMessage = 'Access denied. Please check your permissions.';
        } else if (error.message.includes('500')) {
            userMessage = 'Server error. Please try again later.';
        }

        // Show notification
        this.showNotification(userMessage, 'error');
    }

    reportError(error, context) {
        // In production, you would send this to an error reporting service
        // like Sentry, LogRocket, or Google Analytics
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: error.message,
                fatal: false
            });
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" aria-label="Close notification">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Add show class for animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove after duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });

        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    getErrorLog() {
        return this.errorLog;
    }

    clearErrorLog() {
        this.errorLog = [];
    }
}

// Global error handler instance
const errorHandler = new ErrorHandler();

// Global error event listeners
window.addEventListener('error', (event) => {
    errorHandler.handleError(event.error, {
        type: 'unhandled',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

window.addEventListener('unhandledrejection', (event) => {
    errorHandler.handleError(new Error(event.reason), {
        type: 'unhandledrejection'
    });
});

// Network status monitoring
class NetworkMonitor {
    constructor() {
        this.isOnline = navigator.onLine;
        this.setupListeners();
    }

    setupListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            errorHandler.showNotification('Connection restored', 'success', 3000);
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            errorHandler.showNotification('You are offline. Some features may not work.', 'warning', 5000);
        });
    }

    isConnected() {
        return this.isOnline;
    }

    async checkConnectivity() {
        try {
            const response = await fetch('/api/health', { 
                method: 'HEAD',
                cache: 'no-cache'
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// Global network monitor
const networkMonitor = new NetworkMonitor();

// Enhanced fetch with error handling
async function safeFetch(url, options = {}) {
    try {
        if (!networkMonitor.isConnected()) {
            throw new Error('No internet connection');
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
    } catch (error) {
        errorHandler.handleError(error, { url, options });
        throw error;
    }
}

// Performance monitoring
class PerformanceMonitor {
    constructor() {
        this.metrics = {};
        this.setupMonitoring();
    }

    setupMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            this.measurePageLoad();
        });

        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            this.observeCoreWebVitals();
        }
    }

    measurePageLoad() {
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            this.metrics.pageLoad = {
                loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
                firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
            };

            console.log('Performance metrics:', this.metrics.pageLoad);
        }
    }

    observeCoreWebVitals() {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                this.metrics[entry.name] = entry.value;
                
                // Log poor performance
                if (entry.name === 'largest-contentful-paint' && entry.value > 2500) {
                    console.warn('Poor LCP performance:', entry.value);
                }
            });
        });

        observer.observe({ 
            entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] 
        });
    }

    getMetrics() {
        return this.metrics;
    }
}

// Global performance monitor
const performanceMonitor = new PerformanceMonitor();

// Enhanced form validation
class FormValidator {
    constructor(form) {
        this.form = form;
        this.errors = new Map();
        this.setupValidation();
    }

    setupValidation() {
        this.form.addEventListener('submit', (e) => {
            if (!this.validateForm()) {
                e.preventDefault();
                this.showErrors();
            }
        });

        // Real-time validation
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }

    validateForm() {
        this.errors.clear();
        
        this.form.querySelectorAll('input, textarea, select').forEach(field => {
            this.validateField(field);
        });

        return this.errors.size === 0;
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        
        // Clear previous error
        this.clearFieldError(field);

        // Required field validation
        if (required && !value) {
            this.addFieldError(field, 'This field is required');
            return false;
        }

        // Type-specific validation
        switch (type) {
            case 'email':
                if (value && !this.isValidEmail(value)) {
                    this.addFieldError(field, 'Please enter a valid email address');
                    return false;
                }
                break;
            case 'url':
                if (value && !this.isValidUrl(value)) {
                    this.addFieldError(field, 'Please enter a valid URL');
                    return false;
                }
                break;
            case 'tel':
                if (value && !this.isValidPhone(value)) {
                    this.addFieldError(field, 'Please enter a valid phone number');
                    return false;
                }
                break;
        }

        // Custom validation attributes
        if (field.hasAttribute('minlength')) {
            const minLength = parseInt(field.getAttribute('minlength'));
            if (value.length < minLength) {
                this.addFieldError(field, `Must be at least ${minLength} characters`);
                return false;
            }
        }

        if (field.hasAttribute('maxlength')) {
            const maxLength = parseInt(field.getAttribute('maxlength'));
            if (value.length > maxLength) {
                this.addFieldError(field, `Must be no more than ${maxLength} characters`);
                return false;
            }
        }

        return true;
    }

    addFieldError(field, message) {
        this.errors.set(field, message);
        
        field.classList.add('error');
        
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        errorElement.setAttribute('role', 'alert');
        
        field.parentNode.appendChild(errorElement);
    }

    clearFieldError(field) {
        this.errors.delete(field);
        field.classList.remove('error');
        
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    showErrors() {
        if (this.errors.size > 0) {
            const message = `Please fix ${this.errors.size} error${this.errors.size > 1 ? 's' : ''} in the form.`;
            errorHandler.showNotification(message, 'error');
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
    }
}

// Initialize form validation for all forms
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('form').forEach(form => {
        new FormValidator(form);
    });
});

// Social Media Integration
class SocialMediaManager {
    constructor() {
        this.socialConfig = {
            twitter: {
                username: '@yourusername',
                url: 'https://twitter.com/yourusername'
            },
            linkedin: {
                url: 'https://linkedin.com/in/yourusername'
            },
            github: {
                url: 'https://github.com/yourusername'
            },
            instagram: {
                url: 'https://instagram.com/yourusername'
            },
            youtube: {
                url: 'https://youtube.com/@yourusername'
            }
        };
        
        this.setupSocialFeatures();
    }

    setupSocialFeatures() {
        this.setupShareButtons();
        // this.setupFollowButtons(); // Disabled - footer now has social links
        this.setupSocialMeta();
    }

    setupShareButtons() {
        // Add share buttons to project cards
        document.querySelectorAll('.project-card').forEach(card => {
            const shareButton = document.createElement('button');
            shareButton.className = 'share-btn';
            shareButton.innerHTML = '📤 Share';
            shareButton.setAttribute('aria-label', 'Share this project');
            
            shareButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showShareDialog(card);
            });
            
            card.querySelector('.project-content')?.appendChild(shareButton);
        });
    }

    setupSocialMeta() {
        // Update meta tags for social sharing
        const meta = document.querySelector('meta[property="og:site_name"]');
        if (meta) {
            meta.setAttribute('content', 'Ray CS Portfolio');
        }
    }

    showShareDialog(card) {
        const projectData = this.getProjectData(card);
        const shareUrl = encodeURIComponent(window.location.href);
        const shareText = encodeURIComponent(`Check out this project: ${projectData.title}`);
        
        const dialog = document.createElement('div');
        dialog.className = 'share-dialog modal';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'share-dialog-title');
        
        dialog.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="share-dialog-title">Share Project</h2>
                    <button class="modal-close" aria-label="Close share dialog">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="share-options">
                        <button class="share-option" onclick="socialManager.shareToTwitter('${shareText}', '${shareUrl}')">
                            <i class="fab fa-twitter"></i>
                            Twitter
                        </button>
                        <button class="share-option" onclick="socialManager.shareToLinkedIn('${shareText}', '${shareUrl}')">
                            <i class="fab fa-linkedin"></i>
                            LinkedIn
                        </button>
                        <button class="share-option" onclick="socialManager.shareToFacebook('${shareText}', '${shareUrl}')">
                            <i class="fab fa-facebook"></i>
                            Facebook
                        </button>
                        <button class="share-option" onclick="socialManager.copyToClipboard('${window.location.href}')">
                            <i class="fas fa-link"></i>
                            Copy Link
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        setTimeout(() => dialog.classList.add('active'), 10);
        
        // Close functionality
        const closeBtn = dialog.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeShareDialog(dialog));
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) this.closeShareDialog(dialog);
        });
    }

    closeShareDialog(dialog) {
        dialog.classList.remove('active');
        setTimeout(() => dialog.remove(), 300);
    }

    getProjectData(card) {
        return {
            title: card.querySelector('.project-title')?.textContent || 'Project',
            description: card.querySelector('.project-description')?.textContent || '',
            image: card.querySelector('img')?.src || ''
        };
    }

    shareToTwitter(text, url) {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    }

    shareToLinkedIn(text, url) {
        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
        window.open(linkedinUrl, '_blank', 'width=600,height=400');
    }

    shareToFacebook(text, url) {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            errorHandler.showNotification('Link copied to clipboard!', 'success', 2000);
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            errorHandler.showNotification('Link copied to clipboard!', 'success', 2000);
        }
    }
}

// Global social media manager
const socialManager = new SocialMediaManager();

// Privacy-Friendly Analytics
class Analytics {
    constructor() {
        this.consent = this.getConsent();
        this.events = [];
        this.maxEvents = 100;
        this.setupAnalytics();
    }

    getConsent() {
        // Check for user consent (GDPR compliant)
        return localStorage.getItem('analytics-consent') === 'true';
    }

    setConsent(consent) {
        localStorage.setItem('analytics-consent', consent.toString());
        this.consent = consent;
        
        if (consent) {
            this.setupGoogleAnalytics();
        }
    }

    setupAnalytics() {
        // Show consent banner if not set
        if (this.getConsent() === null) {
            this.showConsentBanner();
        } else if (this.consent) {
            this.setupGoogleAnalytics();
        }

        // Track basic events regardless of consent (privacy-friendly)
        this.trackPageView();
        this.setupEventTracking();
    }

    showConsentBanner() {
        const banner = document.createElement('div');
        banner.className = 'consent-banner';
        banner.innerHTML = `
            <div class="consent-content">
                <p>We use cookies and analytics to improve your experience. 
                   <a href="/privacy" target="_blank">Learn more</a></p>
                <div class="consent-buttons">
                    <button class="btn btn-primary" onclick="analytics.acceptConsent()">Accept</button>
                    <button class="btn btn-secondary" onclick="analytics.declineConsent()">Decline</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        setTimeout(() => banner.classList.add('show'), 1000);
    }

    acceptConsent() {
        this.setConsent(true);
        this.hideConsentBanner();
    }

    declineConsent() {
        this.setConsent(false);
        this.hideConsentBanner();
    }

    hideConsentBanner() {
        const banner = document.querySelector('.consent-banner');
        if (banner) {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
        }
    }

    setupGoogleAnalytics() {
        if (!this.consent) return;

        // Load Google Analytics (replace with your GA4 ID)
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'GA_MEASUREMENT_ID', {
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
        });

        window.gtag = gtag;
    }

    trackPageView() {
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            referrer: document.referrer
        };

        this.trackEvent('page_view', pageData);
    }

    setupEventTracking() {
        // Track project clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.project-card')) {
                const card = e.target.closest('.project-card');
                const title = card.querySelector('.project-title')?.textContent;
                this.trackEvent('project_click', { project_title: title });
            }
        });

        // Track form submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'contact-form') {
                this.trackEvent('contact_form_submit');
            }
        });

        // Track social shares
        document.addEventListener('click', (e) => {
            if (e.target.closest('.share-option')) {
                const platform = e.target.closest('.share-option').textContent.trim();
                this.trackEvent('social_share', { platform });
            }
        });

        // Track theme changes
        document.addEventListener('click', (e) => {
            if (e.target.closest('.theme-toggle')) {
                const currentTheme = document.body.getAttribute('data-theme');
                this.trackEvent('theme_change', { theme: currentTheme });
            }
        });
    }

    trackEvent(eventName, parameters = {}) {
        const event = {
            name: eventName,
            parameters: parameters,
            timestamp: new Date().toISOString(),
            sessionId: this.getSessionId()
        };

        this.events.push(event);
        
        // Keep events array manageable
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Send to Google Analytics if consent given
        if (this.consent && window.gtag) {
            window.gtag('event', eventName, parameters);
        }

        // Store locally for privacy-friendly analytics
        this.storeEvent(event);
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('analytics-session-id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('analytics-session-id', sessionId);
        }
        return sessionId;
    }

    storeEvent(event) {
        // Store events locally for privacy-friendly analytics
        const storedEvents = JSON.parse(localStorage.getItem('analytics-events') || '[]');
        storedEvents.push(event);
        
        // Keep only last 50 events
        if (storedEvents.length > 50) {
            storedEvents.splice(0, storedEvents.length - 50);
        }
        
        localStorage.setItem('analytics-events', JSON.stringify(storedEvents));
    }

    getAnalyticsData() {
        return {
            events: this.events,
            storedEvents: JSON.parse(localStorage.getItem('analytics-events') || '[]'),
            consent: this.consent,
            sessionId: this.getSessionId()
        };
    }

    clearAnalyticsData() {
        this.events = [];
        localStorage.removeItem('analytics-events');
        sessionStorage.removeItem('analytics-session-id');
    }
}

// Global analytics instance
const analytics = new Analytics(); 