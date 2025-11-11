// Smart Panel - AI-powered analysis and preview
import { MarkdownParser } from './MarkdownParser.js';

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
        try {
            const html = MarkdownParser.parse(content);
            this.container.innerHTML = `<div class="markdown-content">${html}</div>`;
        } catch (error) {
            console.error('Markdown rendering error:', error);
            this.showMessage(`Markdown error: ${error.message}`, 'error');
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

