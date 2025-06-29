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