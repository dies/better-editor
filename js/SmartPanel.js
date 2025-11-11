// Smart Panel - AI-powered analysis and preview
export class SmartPanel {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.container = document.getElementById('smartPanelContent');
        this.updateTimeout = null;
        this.lastContent = '';
        this.isEnabled = true;
    }

    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.showMessage('Smart Panel is disabled. Enable it in settings.', 'info');
        }
    }

    scheduleUpdate(content, correctionPrompt) {
        if (!this.isEnabled) return;
        
        clearTimeout(this.updateTimeout);
        
        if (!content.trim()) {
            this.showMessage('Start typing to see smart suggestions...', 'empty');
            return;
        }

        if (content === this.lastContent) return;
        this.lastContent = content;

        this.showMessage('Analyzing...', 'loading');

        this.updateTimeout = setTimeout(async () => {
            await this.update(content, correctionPrompt);
        }, 1000);
    }

    async update(content, correctionPrompt) {
        try {
            // Check if it's markdown
            if (this.isMarkdown(content)) {
                await this.renderMarkdown(content);
            } else {
                await this.renderAnalysis(content, correctionPrompt);
            }
        } catch (error) {
            console.error('Smart panel error:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
        }
    }

    isMarkdown(content) {
        // Detect common markdown patterns
        const mdPatterns = [
            /^#{1,6}\s/m,      // Headers
            /\*\*.*\*\*/,      // Bold
            /\*.*\*/,          // Italic
            /\[.*\]\(.*\)/,    // Links
            /^[-*+]\s/m,       // Lists
            /^>\s/m,           // Blockquotes
            /```/              // Code blocks
        ];
        
        return mdPatterns.some(pattern => pattern.test(content));
    }

    async renderMarkdown(content) {
        // Load marked.js if not already loaded
        if (typeof marked === 'undefined') {
            await this.loadMarked();
        }

        const html = marked.parse(content);
        this.container.innerHTML = `
            <div class="panel-section">
                <h4>📄 Markdown Preview</h4>
                <div class="markdown-content">${html}</div>
            </div>
        `;
    }

    async renderAnalysis(content, correctionPrompt) {
        if (!this.openAIClient.apiKey) {
            this.showMessage('Set your OpenAI API key in settings to enable smart features', 'info');
            return;
        }

        const analysis = await this.openAIClient.analyze(content, correctionPrompt, 'text');
        this.container.innerHTML = `<div class="smart-analysis">${analysis}</div>`;
    }

    showMessage(text, type = 'empty') {
        this.container.innerHTML = `<div class="smart-panel-${type}">${text}</div>`;
    }

    async loadMarked() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    toggle() {
        const panel = document.getElementById('smartPanel');
        panel.classList.toggle('collapsed');
    }
}

