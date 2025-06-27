// Service Worker for Portfolio - Offline functionality and caching

const CACHE_NAME = 'portfolio-v1.0.0';
const STATIC_CACHE = 'portfolio-static-v1';
const DYNAMIC_CACHE = 'portfolio-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/index.html',
    '/admin.html',
    '/css/main.css',
    '/css/components.css',
    '/css/themes.css',
    '/js/utils.js',
    '/js/portfolio.js',
    '/js/ai-chat.js',
    '/js/admin.js',
    '/js/app.js',
    '/data/projects.json',
    '/assets/icons/favicon.ico'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Error caching static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('Service Worker: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip external requests (analytics, etc.)
    if (url.origin !== self.location.origin) {
        return;
    }

    // Skip API requests - let them go to the server
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Handle different types of requests
    if (request.destination === 'image') {
        event.respondWith(handleImageRequest(request));
    } else if (request.destination === 'document') {
        event.respondWith(handleDocumentRequest(request));
    } else {
        event.respondWith(handleOtherRequest(request));
    }
});

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Error handling image request:', error);
        
        // Return a placeholder image if available
        const placeholderResponse = await caches.match('/assets/images/placeholder.jpg');
        if (placeholderResponse) {
            return placeholderResponse;
        }
        
        throw error;
    }
}

// Handle document requests with network-first strategy
async function handleDocumentRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Service Worker: Network failed, trying cache for document:', request.url);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page for HTML requests
        if (request.destination === 'document') {
            return caches.match('/offline.html');
        }
        
        throw error;
    }
}

// Handle other requests (CSS, JS, JSON) with cache-first strategy
async function handleOtherRequest(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Fetch from network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error('Service Worker: Error handling request:', error);
        throw error;
    }
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'contact-form-sync') {
        console.log('Service Worker: Background sync for contact form');
        event.waitUntil(syncContactForm());
    }
});

// Handle contact form sync
async function syncContactForm() {
    try {
        const formData = await getStoredFormData();
        if (formData) {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Clear stored form data
                await clearStoredFormData();
                console.log('Service Worker: Contact form synced successfully');
            }
        }
    } catch (error) {
        console.error('Service Worker: Error syncing contact form:', error);
    }
}

// Store form data for offline sync
async function storeFormData(formData) {
    const db = await openDB();
    await db.put('offlineForms', formData);
}

// Get stored form data
async function getStoredFormData() {
    const db = await openDB();
    return await db.get('offlineForms', 'contact');
}

// Clear stored form data
async function clearStoredFormData() {
    const db = await openDB();
    await db.delete('offlineForms', 'contact');
}

// Open IndexedDB for offline storage
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('PortfolioDB', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object store for offline forms
            if (!db.objectStoreNames.contains('offlineForms')) {
                db.createObjectStore('offlineForms', { keyPath: 'id' });
            }
        };
    });
}

// Push notification handling (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New portfolio update!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Portfolio',
                icon: '/assets/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/icons/xmark.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Portfolio Update', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                    return cache.addAll(event.data.urls);
                })
        );
    }
});

console.log('Service Worker: Loaded'); 