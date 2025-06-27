// Advanced Animations & Micro-interactions Manager

class AnimationManager {
    constructor() {
        this.observers = new Map();
        this.particles = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.setupScrollProgress();
        this.setupIntersectionObservers();
        this.setupParticleSystem();
        this.setupParallaxEffects();
        this.setupStaggerAnimations();
        this.setupRippleEffects();
        this.isInitialized = true;
    }

    // Scroll Progress Indicator
    setupScrollProgress() {
        const progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        document.body.appendChild(progressBar);

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }

    // Enhanced Intersection Observer
    setupIntersectionObservers() {
        // Portfolio items animation
        const portfolioObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 100); // Stagger effect
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observe portfolio items
        document.querySelectorAll('.portfolio-item').forEach(item => {
            portfolioObserver.observe(item);
        });

        // Skills animation
        const skillsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.animateSkillBars(entry.target);
                }
            });
        }, {
            threshold: 0.5
        });

        document.querySelectorAll('.skill-category').forEach(skill => {
            skillsObserver.observe(skill);
        });

        // Store observers for cleanup
        this.observers.set('portfolio', portfolioObserver);
        this.observers.set('skills', skillsObserver);
    }

    // Animate skill bars
    animateSkillBars(container) {
        const skillBars = container.querySelectorAll('.skill-bar');
        skillBars.forEach((bar, index) => {
            setTimeout(() => {
                const percentage = bar.getAttribute('data-percentage') || '80%';
                bar.style.setProperty('--percentage', percentage);
            }, index * 200);
        });
    }

    // Particle System
    setupParticleSystem() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        // Create particle container
        const particleContainer = document.createElement('div');
        particleContainer.className = 'particle-container';
        particleContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 1;
        `;
        hero.appendChild(particleContainer);

        // Generate particles
        this.generateParticles(particleContainer, 15);
    }

    generateParticles(container, count) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random positioning and timing
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            const delay = Math.random() * 3;
            const duration = 3 + Math.random() * 2;
            
            particle.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                animation-delay: ${delay}s;
                animation-duration: ${duration}s;
            `;
            
            container.appendChild(particle);
            this.particles.push(particle);
        }
    }

    // Parallax Effects
    setupParallaxEffects() {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            
            parallaxElements.forEach(element => {
                const speed = element.getAttribute('data-parallax') || 0.5;
                const yPos = -(scrolled * speed);
                element.style.transform = `translateY(${yPos}px)`;
            });
        });
    }

    // Stagger Animations
    setupStaggerAnimations() {
        const staggerElements = document.querySelectorAll('.stagger-children');
        
        staggerElements.forEach(container => {
            const children = container.children;
            Array.from(children).forEach((child, index) => {
                child.style.animationDelay = `${index * 0.1}s`;
            });
        });
    }

    // Ripple Effects
    setupRippleEffects() {
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // Check if target is a button or interactive element
            if (target.matches('.btn, .cta-button, .submit-btn, .quick-action, .demo-btn')) {
                this.createRipple(e, target);
            }
        });
    }

    createRipple(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    // Shimmer Effect
    addShimmerEffect(element) {
        element.style.background = `
            linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
            )
        `;
        element.style.backgroundSize = '200% 100%';
        element.style.animation = 'shimmer 1.5s infinite';
    }

    // Loading States
    showLoadingState(element, text = 'Loading...') {
        const originalContent = element.innerHTML;
        element.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${text}</span>
        `;
        element.disabled = true;
        
        return () => {
            element.innerHTML = originalContent;
            element.disabled = false;
        };
    }

    // Skeleton Loading
    showSkeletonLoading(container, count = 3) {
        const skeletonHTML = Array(count).fill(`
            <div class="skeleton-card skeleton"></div>
        `).join('');
        
        container.innerHTML = skeletonHTML;
    }

    // Smooth Scroll to Element
    smoothScrollTo(elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const elementPosition = element.offsetTop - offset;
        const startPosition = window.pageYOffset;
        const distance = elementPosition - startPosition;
        const duration = 1000;
        let start = null;

        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    // Entrance Animations
    animateEntrance(element, animation = 'fadeInUp', delay = 0) {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            element.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay);
    }

    // Hover Animations
    addHoverAnimation(element, animation = 'gentleLift') {
        element.addEventListener('mouseenter', () => {
            element.style.animation = `${animation} 0.3s ease forwards`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.animation = '';
        });
    }

    // Typing Effect
    typeWriter(element, text, speed = 50) {
        let i = 0;
        element.innerHTML = '';
        
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        
        type();
    }

    // Counter Animation
    animateCounter(element, target, duration = 2000) {
        const start = 0;
        const increment = target / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }

    // Cleanup
    destroy() {
        // Disconnect observers
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        
        // Remove particles
        this.particles.forEach(particle => {
            particle.remove();
        });
        
        this.observers.clear();
        this.particles = [];
        this.isInitialized = false;
    }
}

// Initialize animation manager
let animationManager;

document.addEventListener('DOMContentLoaded', () => {
    animationManager = new AnimationManager();
});

// Export for global access
window.animationManager = animationManager; 