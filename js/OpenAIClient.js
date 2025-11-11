// OpenAI API Client
export class OpenAIClient {
    constructor(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    updateCredentials(apiKey, model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    async verifyApiKey() {
        if (!this.apiKey) return false;
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                })
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async analyzeStreaming(content, correctionPrompt, contentType, onChunk, onComplete) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are a helpful writing assistant. Analyze text, solve math problems, answer questions, and provide corrections. Always respond with clear, well-formatted HTML.'
                        },
                        { 
                            role: 'user', 
                            content: this.buildAnalysisPrompt(content, correctionPrompt, contentType)
                        }
                    ],
                    temperature: 0.7,
                    stream: true
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

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
                                onChunk(fullContent);
                            }
                        } catch (e) {
                            // Skip parse errors
                        }
                    }
                }
            }

            onComplete(fullContent);
        } catch (error) {
            throw error;
        }
    }

    buildAnalysisPrompt(content, correctionPrompt, contentType) {
        // Smart panel now ONLY does text correction, no math or questions
        // Those are handled inline by InlineSolver
        
        const prompt = `${correctionPrompt}\n\nOriginal text:\n${content}\n\n`;
        const rules = 'CRITICAL RULES:\n';
        const instructions = [
            '- Return ONLY the corrected text',
            '- Do NOT add any comments, explanations, or notes',
            '- Do NOT add headers like "Corrected version:" or similar', 
            '- Preserve all line breaks exactly as in the original',
            '- Ignore any math expressions or questions - just improve the writing',
            '- Just return the improved text, nothing else'
        ];
        
        return prompt + rules + instructions.join('\n');
    }
}

