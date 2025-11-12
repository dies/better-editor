// Smart Panel - AI-powered analysis and preview
export class SmartPanel {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.container = document.getElementById('smartPanelContent');
        this.updateTimeout = null;
        this.lastContent = '';
        this.isEnabled = true;
        this.onStatusChange = null;
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
            this.setStatus('Idle');
            return;
        }

        if (content === this.lastContent) return;
        this.lastContent = content;

        // Indicate we're waiting for user to stop typing
        this.setStatus('Waiting for typing to stop...');

        this.updateTimeout = setTimeout(async () => {
            await this.update(content, correctionPrompt);
        }, 1000);
    }

    async update(content, correctionPrompt) {
        try {
            // Check if it's markdown
            if (this.isMarkdown(content)) {
                this.setStatus('Rendering markdown...');
                await this.renderMarkdown(content);
                this.setStatus('Idle');
            } else {
                // Check if content is too short or just math/questions
                if (content.trim().length < 10) {
                    this.showMessage('Write more text to see AI suggestions...', 'empty');
                    this.setStatus('Idle');
                    return;
                }
                
                // Don't process if it's just a single line with math
                if (content.split('\n').length === 1 && /=\s*$/.test(content)) {
                    this.showMessage('Inline solver active. AI corrections for longer text only.', 'info');
                    this.setStatus('Idle');
                    return;
                }
                
                this.setStatus('Sending request to AI...');
                await this.renderAnalysis(content, correctionPrompt);
                this.setStatus('Idle');
            }
        } catch (error) {
            console.error('Smart panel error:', error);
            this.showMessage(`Error: ${error.message}`, 'error');
            this.setStatus('Error: ' + error.message);
        }
    }

    isMarkdown(content) {
        // Only treat as markdown if it has significant markdown syntax
        // This prevents plain text from being mistakenly rendered as markdown
        const mdPatterns = [
            /^#{1,6}\s.+$/m,              // Headers with content
            /\*\*.+\*\*/,                 // Bold text
            /\[.+\]\(.+\)/,               // Links
            /^[-*+]\s.+$/m,               // Lists
            /^>\s.+$/m,                   // Blockquotes
            /```[\s\S]+```/,              // Code blocks
            /^\d+\.\s.+$/m                // Numbered lists
        ];
        
        // Need at least 2 markdown patterns to consider it markdown
        const matches = mdPatterns.filter(pattern => pattern.test(content)).length;
        return matches >= 2;
    }

    async renderMarkdown(content) {
        try {
            // Configure marked for better output
            if (typeof marked !== 'undefined') {
                marked.setOptions({
                    breaks: true,        // Convert \n to <br>
                    gfm: true,          // GitHub Flavored Markdown
                    headerIds: false,
                    mangle: false
                });

                const html = marked.parse(content);
                this.container.innerHTML = `<div class="markdown-content">${html}</div>`;
            } else {
                // Marked not loaded - fallback to plain text
                console.warn('Marked.js not available, showing plain text');
                const pre = document.createElement('pre');
                pre.className = 'smart-analysis';
                pre.textContent = content;
                this.container.innerHTML = '';
                this.container.appendChild(pre);
            }
        } catch (error) {
            console.error('Markdown rendering error:', error);
            // Fallback to plain text on error
            const pre = document.createElement('pre');
            pre.className = 'smart-analysis';
            pre.textContent = content;
            this.container.innerHTML = '';
            this.container.appendChild(pre);
        }
    }

    async renderAnalysis(content, correctionPrompt) {
        if (!this.openAIClient.apiKey) {
            this.showMessage('Set your OpenAI API key in settings to enable smart features', 'info');
            this.setStatus('No API key - set in settings');
            return;
        }

        this.container.innerHTML = '<pre class="smart-analysis streaming"></pre>';
        const analysisPre = this.container.querySelector('.smart-analysis');
        
        let firstChunk = true;

        try {
            this.setStatus('Waiting for AI response...');
            
            await this.openAIClient.analyzeStreaming(
                content,
                correctionPrompt,
                'text',
                // On chunk
                (partialContent) => {
                    if (firstChunk) {
                        this.setStatus('Streaming response...');
                        firstChunk = false;
                    }
                    analysisPre.textContent = partialContent;
                },
                // On complete
                (fullContent) => {
                    analysisPre.textContent = fullContent;
                    analysisPre.classList.remove('streaming');
                    this.setStatus('Idle');
                }
            );
        } catch (error) {
            throw error;
        }
    }

    showMessage(text, type = 'empty') {
        this.container.innerHTML = `<div class="panel-${type}">${text}</div>`;
    }

    setStatus(message) {
        if (this.onStatusChange) {
            this.onStatusChange(message);
        }
    }
}

