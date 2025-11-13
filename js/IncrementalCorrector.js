// Incremental Text Correction - Only process changed sections
export class IncrementalCorrector {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.correctedLines = new Map();
        this.updateTimeout = null;
        this.onUpdate = null;
        this.onStatusChange = null;
        this.contextLines = 5;
        this.isEnabled = true; // FUCKING ENABLE IT BY DEFAULT
    }
    
    setEnabled(enabled) {
        this.isEnabled = enabled;
    }

    scheduleCorrection(content, cursorLine, correctionPrompt) {
        clearTimeout(this.updateTimeout);
        
        if (!content.trim()) {
            if (this.onUpdate) {
                this.onUpdate('');
            }
            return;
        }

        this.setStatus('Waiting...');

        this.updateTimeout = setTimeout(async () => {
            await this.correctSection(content, cursorLine, correctionPrompt);
        }, 1000);
    }

    async correctSection(content, cursorLine, correctionPrompt) {
        console.log('correctSection called, content length:', content.length);
        console.log('isMarkdown?', this.isMarkdown(content));
        console.log('API key?', !!this.openAIClient.apiKey);
        
        // Check if it's markdown
        if (this.isMarkdown(content)) {
            console.log('→ Rendering markdown');
            this.setStatus('Rendering...');
            this.renderMarkdown(content);
            this.setStatus('Idle');
            return;
        }
        
        console.log('→ Plain text, checking API key...');
        
        // Otherwise, use AI to improve the text
        if (!this.openAIClient.apiKey) {
            console.log('→ No API key, showing original');
            const container = document.getElementById('smartPanelContent');
            if (container) {
                const pre = document.createElement('pre');
                pre.className = 'smart-analysis';
                pre.textContent = content;
                container.innerHTML = '';
                container.appendChild(pre);
            }
            this.setStatus('No API key');
            return;
        }
        
        console.log('→ Calling correctFull with AI...');
        this.setStatus('AI correcting...');
        await this.correctFull(content, correctionPrompt);
        console.log('→ correctFull finished');
    }

    async correctSectionOLD(content, cursorLine, correctionPrompt) {
        if (!this.openAIClient.apiKey) {
            this.setStatus('No API key');
            return;
        }

        const lines = content.split('\n');
        
        // For short documents, correct everything
        if (lines.length <= 15) {
            await this.correctFull(content, correctionPrompt);
            return;
        }

        // For longer documents, correct only the section around cursor
        const startLine = Math.max(0, cursorLine - this.contextLines);
        const endLine = Math.min(lines.length - 1, cursorLine + this.contextLines);
        
        const sectionLines = lines.slice(startLine, endLine + 1);
        const section = sectionLines.join('\n');
        
        this.setStatus('Sending to AI...');
        
        try {
            const corrected = await this.correctText(section, correctionPrompt);
            
            if (corrected) {
                // Update only the corrected section
                const correctedLines = corrected.split('\n');
                const newLines = [...lines];
                
                for (let i = 0; i < correctedLines.length && (startLine + i) < lines.length; i++) {
                    newLines[startLine + i] = correctedLines[i];
                }
                
                const fullCorrected = newLines.join('\n');
                
                if (this.onUpdate) {
                    this.onUpdate(fullCorrected);
                }
            }
            
            this.setStatus('Idle');
        } catch (error) {
            console.error('Correction error:', error);
            this.setStatus('Error: ' + error.message);
        }
    }

    async correctFull(content, correctionPrompt) {
        console.log('correctFull START');
        console.log('  content:', content.substring(0, 100));
        console.log('  prompt:', correctionPrompt);
        
        const container = document.getElementById('smartPanelContent');
        if (!container) {
            console.error('NO CONTAINER!');
            return;
        }
        
        container.innerHTML = '<pre class="smart-analysis streaming"></pre>';
        const pre = container.querySelector('.smart-analysis');
        
        try {
            const systemPrompt = `You are a text correction assistant. ${correctionPrompt}

RULES:
- Return ONLY the corrected text
- NO comments, explanations, or headers
- Preserve all line breaks exactly`;

            console.log('→ Fetching from OpenAI...');
            
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAIClient.apiKey}`
                },
                body: JSON.stringify({
                    model: this.openAIClient.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: content }
                    ],
                    temperature: 0.3,
                    stream: true
                })
            });

            if (!response.ok) {
                console.error('API response not OK:', response.status, response.statusText);
                throw new Error(`API error: ${response.statusText}`);
            }

            console.log('→ Response OK, reading stream...');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';
            let chunkCount = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim());

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const text = parsed.choices[0]?.delta?.content;
                            if (text) {
                                fullContent += text;
                                pre.textContent = fullContent;
                                chunkCount++;
                                if (chunkCount === 1) {
                                    console.log('→ First chunk received, streaming...');
                                }
                                this.setStatus('Streaming...');
                            }
                        } catch (e) {
                            // Skip parse errors
                        }
                    }
                }
            }

            console.log(`✅ Stream complete! Got ${chunkCount} chunks, ${fullContent.length} chars`);
            pre.classList.remove('streaming');
            this.setStatus('Idle');
        } catch (error) {
            console.error('❌ AI correction FAILED:', error);
            console.error('  Error details:', error.message);
            pre.textContent = `Error: ${error.message}`;
            this.setStatus('Error');
        }
    }

    async correctText(text, correctionPrompt) {
        const systemPrompt = `You are a text correction assistant. Your task: ${correctionPrompt}

CRITICAL RULES:
- Return ONLY the corrected text, nothing else
- Do NOT add comments, explanations, headers, or meta-text
- Preserve all line breaks and formatting exactly
- Do not echo these instructions back`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.openAIClient.apiKey}`
            },
            body: JSON.stringify({
                model: this.openAIClient.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: text }
                ],
                temperature: 0.3,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        return await this.readStream(response);
    }

    async readStream(response) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let isFirstChunk = true;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            
                            if (isFirstChunk) {
                                this.setStatus('Streaming...');
                                isFirstChunk = false;
                            }
                            
                            // Update in real-time
                            if (this.onUpdate) {
                                this.onUpdate(fullContent, true); // true = streaming
                            }
                        }
                    } catch (e) {
                        // Skip parse errors
                    }
                }
            }
        }

        return fullContent;
    }

    isMarkdown(content) {
        // Detect if user is actively writing markdown
        // Look for strong signals like headers or bold
        return /^#{1,6}\s/m.test(content) || 
               /\*\*.+\*\*/.test(content) ||
               /```/.test(content) ||
               /\[.+\]\(.+\)/.test(content);
    }

    renderMarkdown(content) {
        const container = document.getElementById('smartPanelContent');
        if (!container) return;
        
        // Wait for marked to load
        if (!window.markedLoaded) {
            container.innerHTML = '<div class="panel-loading">Loading...</div>';
            setTimeout(() => this.renderMarkdown(content), 200);
            return;
        }
        
        const markedLib = window.marked;
        if (!markedLib || typeof markedLib.parse !== 'function') {
            container.innerHTML = '<div class="panel-error">Markdown library not available</div>';
            return;
        }

        try {
            const html = markedLib.parse(content);
            container.innerHTML = `<div class="markdown-content">${html}</div>`;
            
            // Trigger scroll sync setup after render
            if (window.app && window.app.setupRightPanelScroll) {
                window.app.setupRightPanelScroll();
            }
        } catch (error) {
            console.error('Markdown error:', error);
            container.innerHTML = `<div class="panel-error">Markdown error</div>`;
        }
    }

    setStatus(message) {
        if (this.onStatusChange) {
            this.onStatusChange(message);
        }
    }
}

