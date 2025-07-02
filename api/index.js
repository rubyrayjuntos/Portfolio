const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const app = express();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create uploads directory if it doesn't exist
        const uploadDir = path.join(__dirname, '../uploads');
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
        sameSite: 'lax'
    }
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

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
        
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (username === adminUsername && password === adminPassword) {
            req.session.authenticated = true;
            req.session.user = { username };
            
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    res.status(500).json({ error: 'Login failed - session error' });
                } else {
                    console.log('✅ Login successful for user:', username);
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
    res.json({ 
        authenticated: !!req.session.authenticated,
        user: req.session.user,
        sessionId: req.sessionID
    });
});

// Image upload endpoint
app.post('/api/upload', requireAuth, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            imageUrl: imageUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Data endpoints
app.get('/api/data/projects', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '../data/projects.json'), 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading projects:', error);
        res.status(500).json({ error: 'Failed to load projects' });
    }
});

app.put('/api/data/projects', requireAuth, async (req, res) => {
    try {
        await fs.writeFile(
            path.join(__dirname, '../data/projects.json'),
            JSON.stringify(req.body, null, 2)
        );
        res.json({ success: true, message: 'Projects updated successfully' });
    } catch (error) {
        console.error('Error saving projects:', error);
        res.status(500).json({ error: 'Failed to save projects' });
    }
});

// Routes for HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/privacy', (req, res) => {
    res.sendFile(path.join(__dirname, '../privacy.html'));
});

app.get('/terms', (req, res) => {
    res.sendFile(path.join(__dirname, '../terms.html'));
});

app.get('/accessibility', (req, res) => {
    res.sendFile(path.join(__dirname, '../accessibility.html'));
});

app.get('/resume', (req, res) => {
    res.sendFile(path.join(__dirname, '../resume.html'));
});

app.get('/asteroids', (req, res) => {
    res.sendFile(path.join(__dirname, '../asteroids.html'));
});

app.get('/offline', (req, res) => {
    res.sendFile(path.join(__dirname, '../offline.html'));
});

app.get('/admin', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, '../simple-admin.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-login.html'));
});

// Handle 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '../index.html'));
});

// Export for Vercel
module.exports = app; 