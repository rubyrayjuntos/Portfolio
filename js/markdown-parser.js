// Markdown Parser for Blog Content

class MarkdownParser {
    constructor() {
        this.rules = [
            // Headers
            { pattern: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
            { pattern: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
            { pattern: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
            
            // Bold and Italic
            { pattern: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
            { pattern: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
            
            // Code blocks
            { pattern: /```(\w+)?\n([\s\S]*?)```/g, replacement: '<pre><code class="language-$1">$2</code></pre>' },
            { pattern: /`([^`]+)`/g, replacement: '<code>$1</code>' },
            
            // Links
            { pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank" rel="noopener">$1</a>' },
            
            // Lists
            { pattern: /^\* (.*$)/gim, replacement: '<li>$1</li>' },
            { pattern: /^- (.*$)/gim, replacement: '<li>$1</li>' },
            
            // Paragraphs
            { pattern: /\n\n/g, replacement: '</p><p>' },
            
            // Line breaks
            { pattern: /\n/g, replacement: '<br>' }
        ];
    }

    parse(markdown) {
        if (!markdown) return '';

        let html = markdown;

        // Wrap in paragraph tags
        html = '<p>' + html + '</p>';

        // Apply markdown rules
        this.rules.forEach(rule => {
            html = html.replace(rule.pattern, rule.replacement);
        });

        // Clean up empty paragraphs
        html = html.replace(/<p><\/p>/g, '');
        html = html.replace(/<p><br><\/p>/g, '');

        // Handle lists properly
        html = this.processLists(html);

        // Add syntax highlighting classes
        html = this.addSyntaxHighlighting(html);

        return html;
    }

    processLists(html) {
        // Find consecutive <li> elements and wrap them in <ul>
        const listPattern = /(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g;
        
        return html.replace(listPattern, (match) => {
            return '<ul>' + match + '</ul>';
        });
    }

    addSyntaxHighlighting(html) {
        // Add Prism.js classes for syntax highlighting
        const codeBlockPattern = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g;
        
        return html.replace(codeBlockPattern, (match, language, code) => {
            const highlightedCode = this.highlightSyntax(code, language);
            return `<pre><code class="language-${language}">${highlightedCode}</code></pre>`;
        });
    }

    highlightSyntax(code, language) {
        // Basic syntax highlighting for common languages
        if (language === 'javascript' || language === 'js') {
            return this.highlightJavaScript(code);
        } else if (language === 'css') {
            return this.highlightCSS(code);
        } else if (language === 'html') {
            return this.highlightHTML(code);
        } else if (language === 'python') {
            return this.highlightPython(code);
        }
        
        return code;
    }

    highlightJavaScript(code) {
        return code
            .replace(/\b(function|const|let|var|if|else|for|while|return|class|import|export|from|default)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(true|false|null|undefined)\b/g, '<span class="literal">$1</span>')
            .replace(/\b(console|document|window|Math|Array|Object|String|Number|Boolean)\b/g, '<span class="builtin">$1</span>')
            .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    }

    highlightCSS(code) {
        return code
            .replace(/\b(background|color|margin|padding|border|display|position|width|height|font)\b/g, '<span class="property">$1</span>')
            .replace(/\b(block|inline|flex|grid|relative|absolute|fixed|static)\b/g, '<span class="value">$1</span>')
            .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
            .replace(/\b(\d+px|\d+em|\d+rem|\d+%)\b/g, '<span class="unit">$1</span>');
    }

    highlightHTML(code) {
        return code
            .replace(/&lt;/g, '<span class="tag">&lt;</span>')
            .replace(/&gt;/g, '<span class="tag">&gt;</span>')
            .replace(/(&lt;[^&]*&gt;)/g, '<span class="tag">$1</span>')
            .replace(/(&lt;\/[^&]*&gt;)/g, '<span class="tag">$1</span>')
            .replace(/(\w+)=/g, '<span class="attribute">$1</span>=')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>');
    }

    highlightPython(code) {
        return code
            .replace(/\b(def|class|if|else|elif|for|while|try|except|finally|import|from|as|return|True|False|None)\b/g, '<span class="keyword">$1</span>')
            .replace(/\b(print|len|range|str|int|float|list|dict|set)\b/g, '<span class="builtin">$1</span>')
            .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
            .replace(/"([^"]*)"/g, '<span class="string">"$1"</span>')
            .replace(/'([^']*)'/g, '<span class="string">\'$1\'</span>')
            .replace(/\b(\d+)\b/g, '<span class="number">$1</span>');
    }

    // Extract table of contents from markdown
    extractTOC(markdown) {
        const headers = [];
        const lines = markdown.split('\n');
        
        lines.forEach(line => {
            const h1Match = line.match(/^# (.*$)/);
            const h2Match = line.match(/^## (.*$)/);
            const h3Match = line.match(/^### (.*$)/);
            
            if (h1Match) {
                headers.push({
                    level: 1,
                    text: h1Match[1],
                    id: this.slugify(h1Match[1])
                });
            } else if (h2Match) {
                headers.push({
                    level: 2,
                    text: h2Match[1],
                    id: this.slugify(h2Match[1])
                });
            } else if (h3Match) {
                headers.push({
                    level: 3,
                    text: h3Match[1],
                    id: this.slugify(h3Match[1])
                });
            }
        });
        
        return headers;
    }

    // Create slug from text
    slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Generate table of contents HTML
    generateTOC(headers) {
        if (headers.length === 0) return '';
        
        let toc = '<nav class="table-of-contents"><h3>Table of Contents</h3><ul>';
        
        headers.forEach(header => {
            const indent = '  '.repeat(header.level - 1);
            toc += `${indent}<li class="toc-level-${header.level}"><a href="#${header.id}">${header.text}</a></li>`;
        });
        
        toc += '</ul></nav>';
        return toc;
    }
}

// Initialize markdown parser
const markdownParser = new MarkdownParser();

// Export for global access
window.markdownParser = markdownParser; 