const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, 'uploads');
        fs.mkdir(uploadDir, { recursive: true }).then(() => {
            cb(null, uploadDir);
        }).catch(err => {
            cb(err);
        });
    },
    filename: function (req, file, cb) {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Only allow image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: true,
    saveUninitialized: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // Added for better security
    }
}));

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Add CORS headers for API requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
};

// Admin authentication endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        console.log('Login attempt:', { username, password: password ? '[HIDDEN]' : 'undefined' });
        
        // In production, use environment variables for credentials
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        console.log('Expected credentials:', { adminUsername, adminPassword: '[HIDDEN]' });
        console.log('Username match:', username === adminUsername);
        console.log('Password match:', password === adminPassword);
        
        if (username === adminUsername && password === adminPassword) {
            req.session.authenticated = true;
            req.session.user = { username };
            
            // Explicitly save the session
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    res.status(500).json({ error: 'Login failed - session error' });
                } else {
                    console.log('✅ Login successful for user:', username);
                    console.log('✅ Session saved successfully');
                    res.json({ success: true, message: 'Login successful' });
                }
            });
        } else {
            console.log('❌ Login failed - invalid credentials');
            res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Logout failed' });
        } else {
            res.json({ success: true, message: 'Logout successful' });
        }
    });
});

app.get('/api/auth/status', (req, res) => {
    console.log('Auth status check - Authenticated:', !!req.session.authenticated);
    
    res.json({ 
        authenticated: !!req.session.authenticated,
        user: req.session.user,
        sessionId: req.sessionID
    });
});

// Test endpoint to verify session
app.get('/api/test-session', (req, res) => {
    console.log('Test session endpoint - Session:', req.session);
    res.json({
        sessionId: req.sessionID,
        authenticated: !!req.session.authenticated,
        user: req.session.user,
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    console.log('=== TEST ENDPOINT CALLED ===');
    console.log('Test endpoint - Session:', req.session);
    console.log('Test endpoint - Session ID:', req.sessionID);
    console.log('Test endpoint - Cookies:', req.headers.cookie);
    res.json({ 
        message: 'Server is working',
        sessionId: req.sessionID,
        authenticated: !!req.session.authenticated
    });
});

// Add cache-busting headers for critical files
app.use((req, res, next) => {
    // Add cache-busting headers for manifest and critical files
    if (req.path === '/manifest.json' || req.path === '/sw.js' || req.path.includes('/assets/icons/')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Serve static files
app.use(express.static('public'));
app.use('/css', express.static('css'));
app.use('/js', express.static('js'));
app.use('/assets', express.static('assets'));
app.use('/data', express.static('data'));
app.use('/uploads', express.static('uploads')); // Serve uploaded images

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy.html'));
});

app.get('/admin', requireAuth, (req, res) => {
    console.log('✅ Serving simple-admin.html to authenticated user');
    res.sendFile(path.join(__dirname, 'simple-admin.html'));
});

app.get('/admin.html', (req, res) => {
    console.log('Admin.html route accessed - Session:', req.session);
    console.log('Authenticated:', !!req.session.authenticated);
    
    if (req.session.authenticated) {
        console.log('Serving admin.html to authenticated user');
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else {
        console.log('Redirecting to login page - not authenticated');
        res.redirect('/admin-login.html');
    }
});

app.get('/asteroids', (req, res) => {
    res.sendFile(path.join(__dirname, 'asteroids.html'));
});

app.get('/asteroids.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'asteroids.html'));
});

// Protected admin API endpoints
app.put('/data/projects.json', requireAuth, async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'projects.json');
        const jsonData = JSON.stringify(req.body, null, 2);
        
        await fs.writeFile(dataPath, jsonData, 'utf8');
        
        res.json({ success: true, message: 'Projects saved successfully' });
    } catch (error) {
        console.error('Error saving projects:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving projects',
            error: error.message 
        });
    }
});

app.put('/data/navigation.json', requireAuth, async (req, res) => {
    try {
        console.log('📝 Navigation save request received');
        console.log('📝 Request body:', req.body);
        
        const dataPath = path.join(__dirname, 'data', 'navigation.json');
        console.log('📝 Data path:', dataPath);
        
        const jsonData = JSON.stringify(req.body, null, 2);
        console.log('📝 JSON data to save:', jsonData);
        
        await fs.writeFile(dataPath, jsonData, 'utf8');
        console.log('📝 File saved successfully');
        
        res.json({ success: true, message: 'Navigation content saved successfully' });
    } catch (error) {
        console.error('❌ Error saving navigation content:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving navigation content',
            error: error.message 
        });
    }
});

// API endpoint to get projects.json
app.get('/data/projects.json', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'projects.json');
        const data = await fs.readFile(dataPath, 'utf8');
        
        // Remove BOM if present
        const cleanData = data.replace(/^\uFEFF/, '');
        
        res.json(JSON.parse(cleanData));
    } catch (error) {
        console.error('Error reading projects:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading projects',
            error: error.message 
        });
    }
});

// API endpoint to get navigation.json
app.get('/data/navigation.json', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'navigation.json');
        const data = await fs.readFile(dataPath, 'utf8');
        
        // Remove BOM if present
        const cleanData = data.replace(/^\uFEFF/, '');
        
        res.json(JSON.parse(cleanData));
    } catch (error) {
        console.error('Error reading navigation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading navigation',
            error: error.message 
        });
    }
});

// Blog API endpoints
app.get('/data/blog-posts.json', async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'blog-posts.json');
        const data = await fs.readFile(dataPath, 'utf8');
        
        // Remove BOM if present
        const cleanData = data.replace(/^\uFEFF/, '');
        
        res.json(JSON.parse(cleanData));
    } catch (error) {
        console.error('Error reading blog posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error reading blog posts',
            error: error.message 
        });
    }
});

app.put('/data/blog-posts.json', requireAuth, async (req, res) => {
    try {
        const dataPath = path.join(__dirname, 'data', 'blog-posts.json');
        const jsonData = JSON.stringify(req.body, null, 2);
        
        await fs.writeFile(dataPath, jsonData, 'utf8');
        
        res.json({ success: true, message: 'Blog posts saved successfully' });
    } catch (error) {
        console.error('Error saving blog posts:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error saving blog posts',
            error: error.message 
        });
    }
});

// API endpoint to handle contact form submissions
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, message, timestamp } = req.body;
        
        // Basic validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address'
            });
        }

        // Create contact data
        const contactData = {
            id: Date.now().toString(),
            name,
            email,
            message,
            timestamp: timestamp || new Date().toISOString(),
            status: 'new'
        };

        // Read existing contacts or create new file
        const contactsPath = path.join(__dirname, 'data', 'contacts.json');
        let contacts = [];
        
        try {
            const existingData = await fs.readFile(contactsPath, 'utf8');
            contacts = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist, start with empty array
            contacts = [];
        }

        // Add new contact
        contacts.push(contactData);

        // Save to file
        await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2), 'utf8');

        // Log for debugging
        console.log('📧 New contact form submission:', {
            name,
            email,
            message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
            timestamp: contactData.timestamp
        });

        res.json({
            success: true,
            message: 'Contact form submitted successfully',
            id: contactData.id
        });

    } catch (error) {
        console.error('Error handling contact form:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing contact form',
            error: error.message
        });
    }
});

// API endpoint to get contact submissions (for admin panel)
app.get('/api/contacts', requireAuth, async (req, res) => {
    try {
        const contactsPath = path.join(__dirname, 'data', 'contacts.json');
        
        try {
            const data = await fs.readFile(contactsPath, 'utf8');
            const contacts = JSON.parse(data);
            res.json(contacts);
        } catch (error) {
            // File doesn't exist, return empty array
            res.json([]);
        }
    } catch (error) {
        console.error('Error reading contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Error reading contacts',
            error: error.message
        });
    }
});

// API endpoint to update contact status (mark as read, etc.)
app.put('/api/contacts/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const contactsPath = path.join(__dirname, 'data', 'contacts.json');
        const data = await fs.readFile(contactsPath, 'utf8');
        const contacts = JSON.parse(data);

        const contactIndex = contacts.findIndex(contact => contact.id === id);
        if (contactIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        contacts[contactIndex].status = status;
        await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2), 'utf8');

        res.json({
            success: true,
            message: 'Contact status updated'
        });

    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating contact',
            error: error.message
        });
    }
});

// Image upload endpoints
app.post('/api/upload/image', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Return the file information
        const fileInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype,
            url: `/uploads/${req.file.filename}`,
            uploadedAt: new Date().toISOString()
        };

        console.log('📸 Image uploaded:', fileInfo);
        res.json({ success: true, file: fileInfo });
    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

app.post('/api/upload/multiple-images', requireAuth, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No image files provided' });
        }

        const uploadedFiles = req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/${file.filename}`,
            uploadedAt: new Date().toISOString()
        }));

        console.log('📸 Multiple images uploaded:', uploadedFiles.length);
        res.json({ success: true, files: uploadedFiles });
    } catch (error) {
        console.error('Multiple image upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// Delete uploaded image
app.delete('/api/upload/image/:filename', requireAuth, async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, 'uploads', filename);
        
        await fs.unlink(filePath);
        console.log('🗑️ Image deleted:', filename);
        res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

// Admin route - serve simple admin interface
app.get('/simple-admin', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Simple Admin</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .section { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px; }
                input, textarea { width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 3px; }
                button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 3px; cursor: pointer; }
                .status { padding: 10px; margin: 10px 0; border-radius: 3px; }
                .success { background: #d4edda; color: #155724; }
                .error { background: #f8d7da; color: #721c24; }
            </style>
        </head>
        <body>
            <h1>Simple Portfolio Admin</h1>
            <a href="/">← Back to Portfolio</a>
            
            <div id="status"></div>
            
            <div class="section">
                <h2>Navigation Content</h2>
                <div>
                    <label>Logo Text:</label>
                    <input type="text" id="nav-logo" placeholder="Portfolio">
                </div>
                <div>
                    <label>Tagline:</label>
                    <input type="text" id="nav-tagline" placeholder="Creative Developer">
                </div>
                <div>
                    <label>Home Title:</label>
                    <input type="text" id="home-title" placeholder="Home">
                </div>
                <div>
                    <label>Home Subtitle:</label>
                    <input type="text" id="home-subtitle" placeholder="Welcome to my portfolio">
                </div>
                <div>
                    <label>Work Title:</label>
                    <input type="text" id="work-title" placeholder="Work">
                </div>
                <div>
                    <label>Work Subtitle:</label>
                    <input type="text" id="work-subtitle" placeholder="Explore my projects">
                </div>
                <div>
                    <label>About Title:</label>
                    <input type="text" id="about-title" placeholder="About">
                </div>
                <div>
                    <label>About Subtitle:</label>
                    <input type="text" id="about-subtitle" placeholder="Learn more about me">
                </div>
                <div>
                    <label>Contact Title:</label>
                    <input type="text" id="contact-title" placeholder="Contact">
                </div>
                <div>
                    <label>Contact Subtitle:</label>
                    <input type="text" id="contact-subtitle" placeholder="Get in touch">
                </div>
                <div>
                    <label>Footer Copyright:</label>
                    <input type="text" id="footer-copyright" placeholder="© 2024 Portfolio">
                </div>
                <div>
                    <label>Footer Description:</label>
                    <textarea id="footer-description" placeholder="Building digital experiences"></textarea>
                </div>
                <button onclick="saveNavigation()">Save Navigation</button>
            </div>
            
            <div class="section">
                <h2>Projects Data</h2>
                <textarea id="projects-json" style="height: 300px; font-family: monospace;" placeholder="Projects JSON will load here..."></textarea>
                <br>
                <button onclick="loadProjects()">Load Projects</button>
                <button onclick="saveProjects()">Save Projects</button>
            </div>
            
            <script>
                async function loadData() {
                    try {
                        const navResponse = await fetch('/data/navigation.json');
                        const navData = await navResponse.json();
                        
                        document.getElementById('nav-logo').value = navData.navigation?.logo || '';
                        document.getElementById('nav-tagline').value = navData.navigation?.tagline || '';
                        document.getElementById('home-title').value = navData.accordion?.home?.title || '';
                        document.getElementById('home-subtitle').value = navData.accordion?.home?.subtitle || '';
                        document.getElementById('work-title').value = navData.accordion?.work?.title || '';
                        document.getElementById('work-subtitle').value = navData.accordion?.work?.subtitle || '';
                        document.getElementById('about-title').value = navData.accordion?.about?.title || '';
                        document.getElementById('about-subtitle').value = navData.accordion?.about?.subtitle || '';
                        document.getElementById('contact-title').value = navData.accordion?.contact?.title || '';
                        document.getElementById('contact-subtitle').value = navData.accordion?.contact?.subtitle || '';
                        document.getElementById('footer-copyright').value = navData.footer?.copyright || '';
                        document.getElementById('footer-description').value = navData.footer?.description || '';

                        const projectsResponse = await fetch('/data/projects.json');
                        const projectsData = await projectsResponse.json();
                        document.getElementById('projects-json').value = JSON.stringify(projectsData, null, 2);

                        showStatus('Data loaded successfully', 'success');
                    } catch (error) {
                        showStatus('Error loading data: ' + error.message, 'error');
                    }
                }

                async function saveNavigation() {
                    try {
                        const navigationData = {
                            navigation: {
                                logo: document.getElementById('nav-logo').value,
                                tagline: document.getElementById('nav-tagline').value
                            },
                            accordion: {
                                home: {
                                    title: document.getElementById('home-title').value,
                                    subtitle: document.getElementById('home-subtitle').value
                                },
                                work: {
                                    title: document.getElementById('work-title').value,
                                    subtitle: document.getElementById('work-subtitle').value
                                },
                                about: {
                                    title: document.getElementById('about-title').value,
                                    subtitle: document.getElementById('about-subtitle').value
                                },
                                contact: {
                                    title: document.getElementById('contact-title').value,
                                    subtitle: document.getElementById('contact-subtitle').value
                                }
                            },
                            footer: {
                                copyright: document.getElementById('footer-copyright').value,
                                description: document.getElementById('footer-description').value
                            }
                        };

                        const response = await fetch('/data/navigation.json', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(navigationData, null, 2)
                        });

                        if (response.ok) {
                            showStatus('Navigation saved successfully', 'success');
                        } else {
                            throw new Error('Failed to save navigation');
                        }
                    } catch (error) {
                        showStatus('Error saving navigation: ' + error.message, 'error');
                    }
                }

                async function loadProjects() {
                    try {
                        const response = await fetch('/data/projects.json');
                        const data = await response.json();
                        document.getElementById('projects-json').value = JSON.stringify(data, null, 2);
                        showStatus('Projects loaded successfully', 'success');
                    } catch (error) {
                        showStatus('Error loading projects: ' + error.message, 'error');
                    }
                }

                async function saveProjects() {
                    try {
                        const jsonText = document.getElementById('projects-json').value;
                        const projectsData = JSON.parse(jsonText);

                        const response = await fetch('/data/projects.json', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify(projectsData, null, 2)
                        });

                        if (response.ok) {
                            showStatus('Projects saved successfully', 'success');
                        } else {
                            throw new Error('Failed to save projects');
                        }
                    } catch (error) {
                        showStatus('Error saving projects: ' + error.message, 'error');
                    }
                }

                function showStatus(message, type) {
                    const statusDiv = document.getElementById('status');
                    statusDiv.className = 'status ' + type;
                    statusDiv.textContent = message;
                    
                    setTimeout(() => {
                        statusDiv.textContent = '';
                        statusDiv.className = 'status';
                    }, 5000);
                }

                document.addEventListener('DOMContentLoaded', loadData);
            </script>
        </body>
        </html>
    `);
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Portfolio server running on http://localhost:${PORT}`);
    console.log(`📝 Admin panel available at http://localhost:${PORT}/admin`);
    console.log(`📁 Static files served from: ${__dirname}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0); 
}); 