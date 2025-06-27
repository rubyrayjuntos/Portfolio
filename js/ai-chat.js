// AI Chat - Enhanced Chatbot functionality with intelligent local responses

class AIChat {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.isTyping = false;
        this.userName = null;
        this.currentProject = null;
        this.conversationStartTime = new Date();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupImageUpload();
        this.addWelcomeMessage();
        this.loadUserPreferences();
    }

    setupEventListeners() {
        // Toggle chat
        const aiToggle = document.querySelector('.ai-toggle');
        if (aiToggle) {
            aiToggle.addEventListener('click', () => this.toggle());
        }

        // Send message on Enter
        const aiInput = document.getElementById('aiInput');
        if (aiInput) {
            aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        // Send button
        const sendBtn = document.querySelector('.ai-send');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
    }

    setupImageUpload() {
        const chatContainer = document.getElementById('aiChat');
        if (!chatContainer) return;

        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.style.display = 'none';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.analyzeImage(file);
            }
        });

        // Create upload button
        const uploadBtn = document.createElement('button');
        uploadBtn.innerHTML = '📷';
        uploadBtn.className = 'ai-send';
        uploadBtn.title = 'Upload image for analysis';
        uploadBtn.addEventListener('click', () => fileInput.click());

        // Add to chat
        const inputContainer = document.querySelector('.ai-input');
        if (inputContainer) {
            inputContainer.appendChild(fileInput);
            inputContainer.appendChild(uploadBtn);
        }

        // Drag and drop
        chatContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            chatContainer.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        });

        chatContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            chatContainer.style.backgroundColor = '';
        });

        chatContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            chatContainer.style.backgroundColor = '';
            const files = e.dataTransfer.files;
            if (files[0] && files[0].type.startsWith('image/')) {
                this.analyzeImage(files[0]);
            }
        });
    }

    toggle() {
        const chat = document.getElementById('aiChat');
        if (!chat) return;

        this.isOpen = !this.isOpen;
        chat.classList.toggle('active', this.isOpen);
        chat.setAttribute('aria-hidden', !this.isOpen);

        if (this.isOpen) {
            const input = document.getElementById('aiInput');
            if (input) {
                input.focus();
            }
        }
    }

    async sendMessage() {
        const input = document.getElementById('aiInput');
        if (!input) return;

        const message = input.value.trim();
        if (!message || this.isTyping) return;

        // Add user message
        this.addMessage(message, 'user');
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            const response = await this.getAIResponse(message);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            this.handleError(error);
        }
    }

    async askAI(question) {
        this.addMessage(question, 'user');
        this.showTypingIndicator();

        try {
            const response = await this.getAIResponse(question);
            this.hideTypingIndicator();
            this.addMessage(response, 'ai');
        } catch (error) {
            this.hideTypingIndicator();
            this.handleError(error);
        }
    }

    addMessage(text, sender, isImage = false) {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message';

        if (sender === 'user') {
            messageDiv.style.background = 'var(--primary)';
            messageDiv.style.color = 'white';
            messageDiv.style.marginLeft = '2rem';
        }

        if (isImage) {
            const img = document.createElement('img');
            img.src = text;
            img.style.maxWidth = '100%';
            img.style.borderRadius = '10px';
            img.style.marginTop = '0.5rem';
            img.alt = 'Uploaded image';
            messageDiv.appendChild(img);
        } else {
            // Support for rich text and links
            messageDiv.innerHTML = this.formatMessage(text);
        }

        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;

        // Add to conversation history
        this.conversationHistory.push({ role: sender, content: text });
    }

    formatMessage(text) {
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convert line breaks to <br> tags
        text = text.replace(/\n/g, '<br>');
        
        // Add emoji support
        text = text.replace(/:\)/g, '😊').replace(/:\(/g, '😢').replace(/;\)/g, '😉');
        
        return text;
    }

    showTypingIndicator() {
        const messages = document.getElementById('aiMessages');
        if (!messages) return;

        this.isTyping = true;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="typing-dots">
                    <span></span><span></span><span></span>
                </div>
                AI is typing...
            </div>
        `;
        messages.appendChild(typingDiv);
        messages.scrollTop = messages.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
        this.isTyping = false;
    }

    async getAIResponse(message) {
        // Add to conversation history
        this.conversationHistory.push({ role: 'user', content: message });

        // Simulate typing delay for more natural feel
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

        // Prepare context-aware response
        const response = this.generateContextualResponse(message);
        
        // Add AI response to conversation history
        this.conversationHistory.push({ role: 'assistant', content: response });
        
        return response;
    }

    generateContextualResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Extract user name if mentioned
        const nameMatch = message.match(/my name is (\w+)/i) || message.match(/i'm (\w+)/i) || message.match(/call me (\w+)/i);
        if (nameMatch && !this.userName) {
            this.userName = nameMatch[1];
            this.saveUserPreferences();
        }

        // Portfolio-specific responses with enhanced intelligence
        if (lowerMessage.includes('art') || lowerMessage.includes('digital art') || lowerMessage.includes('creative')) {
            return this.getArtResponse(lowerMessage);
        }
        
        if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('development') || lowerMessage.includes('tech')) {
            return this.getCodeResponse(lowerMessage);
        }
        
        if (lowerMessage.includes('writing') || lowerMessage.includes('story') || lowerMessage.includes('fiction') || lowerMessage.includes('book')) {
            return this.getWritingResponse(lowerMessage);
        }
        
        if (lowerMessage.includes('contact') || lowerMessage.includes('email') || lowerMessage.includes('reach') || lowerMessage.includes('hire')) {
            return this.getContactResponse(lowerMessage);
        }
        
        if (lowerMessage.includes('about') || lowerMessage.includes('who') || lowerMessage.includes('background') || lowerMessage.includes('experience')) {
            return this.getAboutResponse(lowerMessage);
        }
        
        if (lowerMessage.includes('help') || lowerMessage.includes('what can you do') || lowerMessage.includes('capabilities')) {
            return this.getHelpResponse(lowerMessage);
        }

        if (lowerMessage.includes('project') || lowerMessage.includes('work') || lowerMessage.includes('portfolio')) {
            return this.getProjectResponse(lowerMessage);
        }

        if (lowerMessage.includes('skill') || lowerMessage.includes('technology') || lowerMessage.includes('stack')) {
            return this.getSkillsResponse(lowerMessage);
        }

        if (lowerMessage.includes('resume') || lowerMessage.includes('cv') || lowerMessage.includes('experience')) {
            return this.getResumeResponse(lowerMessage);
        }

        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
            return this.getGreetingResponse();
        }

        // Default response with suggestions
        return this.getDefaultResponse(lowerMessage);
    }

    getArtResponse(message) {
        const responses = [
            "I have several digital art projects in my portfolio! My 'Digital Art Collection' features generative abstract pieces exploring color theory and emotional expression. The work uses Processing, p5.js, and WebGL to create algorithmic visualizations. Would you like me to show you the gallery?",
            "My digital art focuses on generative and algorithmic pieces. I create interactive installations that respond to user input, exploring themes of technology and human emotion. The 'Neural Dreams' series uses machine learning to generate unique visual patterns.",
            "I work with both 2D and 3D digital art, specializing in generative art and creative coding. My pieces often explore the intersection of mathematics and aesthetics, creating visually stunning algorithmic compositions."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getCodeResponse(message) {
        const responses = [
            "I work with various technologies including React, JavaScript, Python, and machine learning. My 'Interactive Web App' project showcases a data visualization dashboard with real-time updates, and I have a machine learning sentiment analysis tool. Which area interests you most?",
            "My coding projects range from full-stack web applications to creative coding experiments. I'm particularly passionate about data visualization, interactive experiences, and building tools that bridge technology and creativity.",
            "I specialize in JavaScript/React for frontend development, Python for data science and ML, and creative coding with WebGL/Three.js. My projects demonstrate both technical proficiency and creative problem-solving."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getWritingResponse(message) {
        const responses = [
            "I write speculative fiction exploring technology and humanity. My collection includes 'The Last Archive' (speculative fiction), 'Memory Palace' (cyberpunk), 'Quantum Entangled' (romance/sci-fi), and 'The Algorithm's Garden' (literary fiction). Each story examines different aspects of our digital future.",
            "My writing explores themes of technology, identity, and human connection in the digital age. I blend elements of science fiction, cyberpunk, and literary fiction to create thought-provoking narratives about our relationship with technology.",
            "I've published several short stories and am working on a novel. My writing style combines speculative elements with deep character development, often exploring how technology shapes human relationships and society."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getContactResponse(message) {
        return "You can reach me at hello@yourportfolio.com, or connect with me on LinkedIn and GitHub. I'm always interested in new creative opportunities and collaborations! Feel free to send me a message through the contact form on this site. I typically respond within 24 hours.";
    }

    getAboutResponse(message) {
        const responses = [
            "I'm a multidisciplinary creative professional passionate about the intersection of technology and art. My work spans digital art, web development, creative writing, and brand design. I believe in creating experiences that are both technically sophisticated and emotionally resonant.",
            "With a background in computer science and digital arts, I bridge the gap between technical implementation and creative vision. I love exploring how technology can enhance human expression and storytelling.",
            "I'm a creative technologist who believes that the best digital experiences come from combining technical expertise with artistic sensibility. My work reflects my passion for innovation and human-centered design."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    getHelpResponse(message) {
        return "I can help you navigate this portfolio, explain my projects, discuss my creative process, and answer questions about my work. I can also analyze images you share with me. Just ask me about art, code, writing, or any specific project! You can also use the quick action buttons above for common questions.";
    }

    getProjectResponse(message) {
        const responses = [
            "My portfolio includes several key projects: a generative art collection, an interactive data visualization dashboard, a machine learning sentiment analysis tool, and a collection of speculative fiction stories. Which type of project interests you most?",
            "I have projects across different domains - from interactive web applications to creative coding experiments. Each project demonstrates different aspects of my skills and creative vision. Would you like me to explain any specific project in detail?",
            "My work spans multiple disciplines, including digital art installations, web applications, creative writing, and brand identity design. Each project showcases my ability to blend technical skills with creative thinking."
        ];

        // If they ask about specific project types, give more detailed responses
        if (message.includes('art') || message.includes('creative')) {
            return "My art projects include 'Neural Dreams' - a generative art series using machine learning algorithms, 'Color Theory Explorations' - interactive color palette generators, and 'Digital Landscapes' - 3D procedural environments. Each piece explores the relationship between technology and artistic expression.";
        }
        
        if (message.includes('web') || message.includes('app') || message.includes('website')) {
            return "My web projects include this portfolio site (built with vanilla JS and modern CSS), a real-time data visualization dashboard using D3.js and React, and several interactive web applications that demonstrate full-stack development skills.";
        }
        
        if (message.includes('machine learning') || message.includes('ai') || message.includes('ml')) {
            return "My ML projects include a sentiment analysis tool for social media monitoring, a recommendation system for creative content, and various computer vision experiments. I use Python with TensorFlow/PyTorch and focus on practical applications.";
        }

        return responses[Math.floor(Math.random() * responses.length)];
    }

    getSkillsResponse(message) {
        return "My technical skills include JavaScript/React (90%), Python/ML (80%), WebGL/Three.js (75%), and D3.js (80%). For creative skills, I'm proficient in digital art (85%), UI/UX design (80%), and creative writing. I'm always learning new technologies and techniques!";
    }

    getResumeResponse(message) {
        return "You can view my detailed resume by clicking the 'Resume' link in the navigation menu. It includes my professional experience, education, technical skills, and notable projects. I'm also available for freelance work and collaborations!";
    }

    getGreetingResponse() {
        const greetings = [
            `👋 Hi${this.userName ? ' ' + this.userName : ''}! I'm your AI portfolio guide. How can I help you explore my work today?`,
            `Hello${this.userName ? ' ' + this.userName : ''}! 👋 I'm here to help you navigate this portfolio. What would you like to know about?`,
            `Hey${this.userName ? ' ' + this.userName : ''}! 🤖 I'm your AI assistant. I can tell you about my projects, skills, or help you get in touch. What interests you?`
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    getDefaultResponse(message) {
        const suggestions = [
            "That's an interesting question! I'd be happy to help you explore my portfolio. You can ask me about my art projects, coding work, writing samples, or how to get in touch. What would you like to know more about?",
            "I'm not sure I understood that completely, but I'd love to help! You can ask me about my projects, skills, experience, or how to contact me. What area of my work interests you?",
            "Interesting! While I might not have a specific answer for that, I can tell you about my creative work, technical projects, or help you navigate this portfolio. What would you like to explore?"
        ];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    async analyzeImage(imageFile) {
        try {
            // Validate file
            if (typeof utils !== 'undefined' && utils.validateImageFile) {
                utils.validateImageFile(imageFile);
            }
            
            this.addMessage('Analyzing image...', 'ai');
            
            // Simulate image analysis with realistic delay
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));
            
            // Remove the "analyzing" message
            const messages = document.getElementById('aiMessages');
            const lastMessage = messages.lastElementChild;
            if (lastMessage && lastMessage.textContent === 'Analyzing image...') {
                lastMessage.remove();
            }
            
            // Generate analysis based on file properties
            const analysis = this.generateImageAnalysis(imageFile);
            this.addMessage(analysis, 'ai');
            
        } catch (error) {
            console.error('Image analysis error:', error);
            this.addMessage('Sorry, I had trouble analyzing that image. Please make sure it\'s a valid image file under 5MB.', 'ai');
        }
    }

    generateImageAnalysis(imageFile) {
        const fileSize = imageFile.size;
        const fileName = imageFile.name;
        const fileType = imageFile.type;
        
        const analyses = [
            `I can see this is a ${fileType.split('/')[1].toUpperCase()} image (${(fileSize / 1024 / 1024).toFixed(1)}MB). The composition shows interesting visual elements that could inspire creative projects. The file structure suggests it was created with professional software.`,
            `Analyzing this ${fileType.split('/')[1].toUpperCase()} file... I can see it's a well-structured image with good resolution. The file size indicates it contains rich visual data that could be used in various creative applications.`,
            `This ${fileType.split('/')[1].toUpperCase()} image appears to be well-optimized. The file properties suggest it could work well in web applications or digital art projects. The format is commonly used in creative workflows.`
        ];
        
        return analyses[Math.floor(Math.random() * analyses.length)];
    }

    handleError(error) {
        console.error('AI Chat Error:', error);
        
        let errorMessage = 'Sorry, I encountered an error. Please try again later.';
        
        if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
        
        this.addMessage(errorMessage, 'ai');
    }

    addWelcomeMessage() {
        setTimeout(() => {
            this.addMessage('👋 Hi! I\'m your AI portfolio guide. I can discuss projects, analyze images you share, and help you navigate this portfolio. What would you like to explore?', 'ai');
        }, 1000);
    }

    // Quick action handlers
    handleQuickAction(action) {
        const actions = {
            'art': 'Tell me about the art projects',
            'code': 'Show me coding examples',
            'writing': 'What writing samples are available?',
            'contact': 'How can I contact you?'
        };
        
        const question = actions[action];
        if (question) {
            this.askAI(question);
        }
    }

    // User preferences
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('ai-chat-preferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.userName = prefs.userName;
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        }
    }

    saveUserPreferences() {
        try {
            const prefs = {
                userName: this.userName,
                lastVisit: new Date().toISOString()
            };
            localStorage.setItem('ai-chat-preferences', JSON.stringify(prefs));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    // Clear conversation
    clearConversation() {
        const messages = document.getElementById('aiMessages');
        if (messages) {
            messages.innerHTML = '';
        }
        this.conversationHistory = [];
        this.addWelcomeMessage();
    }

    // Get conversation statistics
    getConversationStats() {
        return {
            totalMessages: this.conversationHistory.length,
            userMessages: this.conversationHistory.filter(msg => msg.role === 'user').length,
            aiMessages: this.conversationHistory.filter(msg => msg.role === 'assistant').length,
            userName: this.userName
        };
    }
}

// Initialize AI chat
let aiChat;

document.addEventListener('DOMContentLoaded', () => {
    aiChat = new AIChat();
});

// Global functions for HTML onclick handlers
function toggleAI() {
    if (aiChat) {
        aiChat.toggle();
    }
}

function sendMessage() {
    if (aiChat) {
        aiChat.sendMessage();
    }
}

function askAI(question) {
    if (aiChat) {
        aiChat.askAI(question);
    }
}

function handleKeypress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function clearConversation() {
    if (aiChat) {
        aiChat.clearConversation();
    }
}

// Export for global access
window.aiChat = aiChat; 