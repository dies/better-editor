// Incremental Text Correction - Only process changed sections
export class IncrementalCorrector {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.correctedLines = new Map(); // Store corrected version of each line
        this.updateTimeout = null;
        this.onUpdate = null;
        this.onStatusChange = null;
        this.contextLines = 5; // Lines before/after for context
    }

    scheduleCorrection(content, cursorLine, correctionPrompt) {
        clearTimeout(this.updateTimeout);
        
        if (!content.trim()) {
            if (this.onUpdate) {
                this.onUpdate('');
            }
            return;
        }

        this.setStatus('Waiting for typing to stop...');

        this.updateTimeout = setTimeout(async () => {
            await this.correctSection(content, cursorLine, correctionPrompt);
        }, 1000);
    }

    async correctSection(content, cursorLine, correctionPrompt) {
        if (!this.openAIClient.apiKey) {
            if (this.onUpdate) {
                this.onUpdate(content);
            }
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
        this.setStatus('Sending to AI...');
        
        try {
            const corrected = await this.correctText(content, correctionPrompt);
            
            if (corrected && this.onUpdate) {
                this.onUpdate(corrected);
            }
            
            this.setStatus('Idle');
        } catch (error) {
            console.error('Correction error:', error);
            this.setStatus('Error: ' + error.message);
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

    setStatus(message) {
        if (this.onStatusChange) {
            this.onStatusChange(message);
        }
    }
}

