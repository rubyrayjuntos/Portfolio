// Asteroids Game Engine
console.log('🚀 Asteroids.js loaded!');

class AsteroidsGame {
    constructor() {
        console.log('🎮 Creating AsteroidsGame instance...');
        this.canvas = document.getElementById('gameCanvas');
        console.log('Canvas element:', this.canvas);
        
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        console.log('Canvas dimensions:', this.width, 'x', this.height);
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.score = 0;
        this.startTime = 0;
        this.gameTime = 0;
        
        // Sound system
        this.soundEnabled = true;
        this.audioContext = null;
        this.initAudio();
        
        // Game objects
        this.ship = new Ship(this.width / 2, this.height / 2);
        this.projectiles = [];
        this.asteroids = [];
        this.particles = [];
        this.stars = this.generateStars();
        
        // Input handling
        this.keys = {};
        this.setupInput();
        
        // Game loop
        this.lastTime = 0;
        this.animationId = null;
        
        // Difficulty scaling
        this.asteroidSpawnTimer = 0;
        this.asteroidSpawnRate = 2000; // ms
        this.maxAsteroids = 8;
        
        this.init();
        console.log('✅ AsteroidsGame initialized successfully!');
    }
    
    init() {
        this.updateStats();
        this.draw();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
            this.soundEnabled = false;
        }
    }
    
    playSound(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.log('Audio playback error:', e);
        }
    }
    
    generateStars() {
        const stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.5 + 0.1
            });
        }
        return stars;
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default for game keys
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
    }
    
    start() {
        this.gameRunning = true;
        this.gamePaused = false;
        this.startTime = Date.now();
        this.score = 0;
        this.projectiles = [];
        this.asteroids = [];
        this.particles = [];
        this.ship.reset(this.width / 2, this.height / 2);
        this.asteroidSpawnTimer = 0;
        
        // Spawn initial asteroids
        for (let i = 0; i < 3; i++) {
            this.spawnAsteroid();
        }
        
        this.gameLoop();
        this.updateButtons();
        this.playSound(440, 0.1, 'sine', 0.2); // Start sound
    }
    
    pause() {
        this.gamePaused = !this.gamePaused;
        this.updateButtons();
        if (this.gamePaused) {
            this.playSound(330, 0.1, 'square', 0.2);
        } else {
            this.playSound(440, 0.1, 'sine', 0.2);
        }
    }
    
    stop() {
        this.gameRunning = false;
        this.gamePaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateButtons();
        this.showGameOver();
    }
    
    restart() {
        this.stop();
        setTimeout(() => this.start(), 100);
    }
    
    gameLoop(currentTime = 0) {
        if (!this.gameRunning || this.gamePaused) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.draw();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        // Update game time
        this.gameTime = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Update ship
        this.ship.update(deltaTime, this.keys, this.width, this.height);
        
        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.update(deltaTime);
            return proj.active;
        });
        
        // Update asteroids
        this.asteroids = this.asteroids.filter(asteroid => {
            asteroid.update(deltaTime, this.width, this.height);
            return asteroid.active;
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.active;
        });
        
        // Update stars
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.height) {
                star.y = 0;
                star.x = Math.random() * this.width;
            }
        });
        
        // Spawn new asteroids
        this.asteroidSpawnTimer += deltaTime;
        if (this.asteroidSpawnTimer > this.asteroidSpawnRate && this.asteroids.length < this.maxAsteroids) {
            this.spawnAsteroid();
            this.asteroidSpawnTimer = 0;
        }
        
        // Check collisions
        this.checkCollisions();
        
        // Update stats
        this.updateStats();
    }
    
    spawnAsteroid() {
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        
        switch (side) {
            case 0: // top
                x = Math.random() * this.width;
                y = -50;
                break;
            case 1: // right
                x = this.width + 50;
                y = Math.random() * this.height;
                break;
            case 2: // bottom
                x = Math.random() * this.width;
                y = this.height + 50;
                break;
            case 3: // left
                x = -50;
                y = Math.random() * this.height;
                break;
        }
        
        const asteroid = new Asteroid(x, y);
        this.asteroids.push(asteroid);
    }
    
    checkCollisions() {
        // Ship vs Asteroids
        for (let asteroid of this.asteroids) {
            if (this.ship.collidesWith(asteroid)) {
                this.gameOver();
                return;
            }
        }
        
        // Projectiles vs Asteroids
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            for (let j = this.asteroids.length - 1; j >= 0; j--) {
                const asteroid = this.asteroids[j];
                if (proj.collidesWith(asteroid)) {
                    // Destroy asteroid
                    this.score += Math.floor(asteroid.radius * 10);
                    this.createExplosion(asteroid.x, asteroid.y, asteroid.radius);
                    this.asteroids.splice(j, 1);
                    
                    // Destroy projectile
                    this.projectiles.splice(i, 1);
                    
                    // Play explosion sound
                    this.playSound(200 + Math.random() * 100, 0.3, 'sawtooth', 0.4);
                    
                    break;
                }
            }
        }
    }
    
    createExplosion(x, y, radius) {
        const particleCount = Math.floor(radius * 2);
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = Math.random() * 2 + 1;
            const particle = new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                Math.random() * 1000 + 500
            );
            this.particles.push(particle);
        }
    }
    
    gameOver() {
        this.playSound(150, 0.5, 'sawtooth', 0.6);
        this.stop();
    }
    
    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalTime').textContent = this.gameTime;
        document.getElementById('gameOver').style.display = 'block';
    }
    
    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('time').textContent = this.gameTime;
        document.getElementById('asteroidCount').textContent = this.asteroids.length;
    }
    
    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.gameRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            pauseBtn.textContent = this.gamePaused ? 'Resume' : 'Pause';
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            pauseBtn.textContent = 'Pause';
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Draw stars
        this.ctx.fillStyle = '#fff';
        this.stars.forEach(star => {
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw game objects
        this.ship.draw(this.ctx);
        this.projectiles.forEach(proj => proj.draw(this.ctx));
        this.asteroids.forEach(asteroid => asteroid.draw(this.ctx));
        this.particles.forEach(particle => particle.draw(this.ctx));
    }
}

// Ship class
class Ship {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.rotationSpeed = 0.03;
        this.thrust = 0.5;
        this.maxSpeed = 8;
        this.friction = 0.98;
        this.size = 20;
        this.active = true;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.active = true;
    }
    
    update(deltaTime, keys, width, height) {
        // Rotation - snap to 45-degree increments
        if (keys['ArrowLeft']) {
            // Snap to nearest 45-degree angle counterclockwise
            const targetAngle = Math.floor(this.angle / (Math.PI / 4)) * (Math.PI / 4) - (Math.PI / 4);
            this.angle = targetAngle;
        }
        if (keys['ArrowRight']) {
            // Snap to nearest 45-degree angle clockwise
            const targetAngle = Math.ceil(this.angle / (Math.PI / 4)) * (Math.PI / 4) + (Math.PI / 4);
            this.angle = targetAngle;
        }
        
        // Thrust
        if (keys['ArrowUp']) {
            this.vx += Math.cos(this.angle) * this.thrust * deltaTime * 0.016;
            this.vy += Math.sin(this.angle) * this.thrust * deltaTime * 0.016;
        }
        if (keys['ArrowDown']) {
            this.vx -= Math.cos(this.angle) * this.thrust * deltaTime * 0.016;
            this.vy -= Math.sin(this.angle) * this.thrust * deltaTime * 0.016;
        }
        
        // Apply friction
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Limit speed
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        
        // Wrap around screen
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = height + this.size;
        if (this.y > height + this.size) this.y = -this.size;
    }
    
    shoot() {
        const speed = 15;
        const proj = new Projectile(
            this.x + Math.cos(this.angle) * this.size,
            this.y + Math.sin(this.angle) * this.size,
            this.vx + Math.cos(this.angle) * speed,
            this.vy + Math.sin(this.angle) * speed
        );
        return proj;
    }
    
    collidesWith(asteroid) {
        const dx = this.x - asteroid.x;
        const dy = this.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + asteroid.radius;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Draw ship with branded colors
        ctx.strokeStyle = '#363ae7'; // Primary blue
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.size, 0);
        ctx.lineTo(-this.size / 2, -this.size / 2);
        ctx.lineTo(-this.size / 4, 0);
        ctx.lineTo(-this.size / 2, this.size / 2);
        ctx.closePath();
        ctx.stroke();
        
        // Draw engine glow with secondary color
        ctx.fillStyle = '#f13ba2'; // Secondary pink
        ctx.beginPath();
        ctx.moveTo(-this.size / 4, 0);
        ctx.lineTo(-this.size / 2, -this.size / 4);
        ctx.lineTo(-this.size, 0);
        ctx.lineTo(-this.size / 2, this.size / 4);
        ctx.closePath();
        ctx.fill();
        
        // Add accent color details
        ctx.strokeStyle = '#a98a1c'; // Accent gold
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.size * 0.8, 0);
        ctx.lineTo(this.size * 0.6, -this.size * 0.3);
        ctx.lineTo(this.size * 0.6, this.size * 0.3);
        ctx.closePath();
        ctx.stroke();
        
        ctx.restore();
    }
}

// Projectile class
class Projectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = 1000; // 1 second
        this.maxLife = this.life;
        this.active = true;
        this.size = 3;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 0.016;
        this.y += this.vy * deltaTime * 0.016;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    collidesWith(asteroid) {
        const dx = this.x - asteroid.x;
        const dy = this.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.size + asteroid.radius;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Draw laser beam with branded colors
        ctx.strokeStyle = '#363ae7'; // Primary blue
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.1, this.y - this.vy * 0.1);
        ctx.stroke();
        
        // Draw glow with secondary color
        ctx.strokeStyle = '#f13ba2'; // Secondary pink
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Add accent color trail
        ctx.strokeStyle = '#a98a1c'; // Accent gold
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.vx * 0.2, this.y - this.vy * 0.2);
        ctx.stroke();
        
        ctx.restore();
    }
}

// Asteroid class
class Asteroid {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 20 + 15;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.active = true;
        this.vertices = this.generateVertices();
    }
    
    generateVertices() {
        const vertices = [];
        const numVertices = Math.floor(Math.random() * 4) + 8;
        
        for (let i = 0; i < numVertices; i++) {
            const angle = (Math.PI * 2 * i) / numVertices;
            const radius = this.radius * (0.7 + Math.random() * 0.6);
            vertices.push({
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius
            });
        }
        
        return vertices;
    }
    
    update(deltaTime, width, height) {
        this.x += this.vx * deltaTime * 0.016;
        this.y += this.vy * deltaTime * 0.016;
        this.rotation += this.rotationSpeed * deltaTime;
        
        // Wrap around screen
        if (this.x < -this.radius) this.x = width + this.radius;
        if (this.x > width + this.radius) this.x = -this.radius;
        if (this.y < -this.radius) this.y = height + this.radius;
        if (this.y > height + this.radius) this.y = -this.radius;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw asteroid with branded colors
        ctx.strokeStyle = '#363ae7'; // Primary blue
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        
        for (let i = 1; i < this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        
        ctx.closePath();
        ctx.stroke();
        
        // Draw detail lines with secondary color
        ctx.strokeStyle = '#f13ba2'; // Secondary pink
        ctx.lineWidth = 2;
        for (let i = 0; i < this.vertices.length; i += 2) {
            const next = (i + 1) % this.vertices.length;
            ctx.beginPath();
            ctx.moveTo(this.vertices[i].x * 0.5, this.vertices[i].y * 0.5);
            ctx.lineTo(this.vertices[next].x * 0.5, this.vertices[next].y * 0.5);
            ctx.stroke();
        }
        
        // Add accent color highlights
        ctx.strokeStyle = '#a98a1c'; // Accent gold
        ctx.lineWidth = 1;
        for (let i = 0; i < this.vertices.length; i += 3) {
            const next = (i + 2) % this.vertices.length;
            ctx.beginPath();
            ctx.moveTo(this.vertices[i].x * 0.3, this.vertices[i].y * 0.3);
            ctx.lineTo(this.vertices[next].x * 0.3, this.vertices[next].y * 0.3);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Particle class
class Particle {
    constructor(x, y, vx, vy, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.active = true;
        this.size = Math.random() * 3 + 1;
    }
    
    update(deltaTime) {
        this.x += this.vx * deltaTime * 0.016;
        this.y += this.vy * deltaTime * 0.016;
        
        // Apply friction
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        this.life -= deltaTime;
        if (this.life <= 0) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // Create branded color gradient for particles
        const colorProgress = 1 - (this.life / this.maxLife);
        let color;
        
        if (colorProgress < 0.33) {
            // Start with primary blue
            color = '#363ae7';
        } else if (colorProgress < 0.66) {
            // Transition to secondary pink
            color = '#f13ba2';
        } else {
            // End with accent gold
            color = '#a98a1c';
        }
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add glow effect
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// Global game instance
let game;

// Global functions for HTML buttons
function startGame() {
    console.log('🎯 startGame() called');
    if (!game) {
        console.log('Creating new game instance...');
        game = new AsteroidsGame();
    }
    console.log('Starting game...');
    game.start();
}

function togglePause() {
    console.log('⏸️ togglePause() called');
    if (game) {
        game.pause();
    }
}

function restartGame() {
    console.log('🔄 restartGame() called');
    if (game) {
        game.restart();
    }
    document.getElementById('gameOver').style.display = 'none';
}

function toggleSound() {
    console.log('🔊 toggleSound() called');
    if (game) {
        game.soundEnabled = !game.soundEnabled;
        const btn = document.getElementById('soundBtn');
        btn.textContent = game.soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
        
        // Play test sound
        if (game.soundEnabled) {
            game.playSound(440, 0.1, 'sine', 0.2);
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (!game || !game.gameRunning) return;
    
    switch (e.code) {
        case 'Space':
            if (!game.gamePaused) {
                const proj = game.ship.shoot();
                game.projectiles.push(proj);
                game.playSound(800, 0.1, 'square', 0.3);
            }
            e.preventDefault();
            break;
        case 'KeyP':
            game.pause();
            e.preventDefault();
            break;
        case 'KeyR':
            game.restart();
            document.getElementById('gameOver').style.display = 'none';
            e.preventDefault();
            break;
    }
});

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded event fired');
    console.log('Creating initial game instance...');
    game = new AsteroidsGame();
    console.log('Game instance created:', game);
}); 