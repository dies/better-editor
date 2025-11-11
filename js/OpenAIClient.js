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
            const systemPrompt = `You are a text correction assistant. Your task: ${correctionPrompt}

CRITICAL RULES:
- Return ONLY the corrected text, nothing else
- Do NOT add comments, explanations, headers, or meta-text
- Preserve all line breaks and formatting exactly as in the original
- Do not echo these instructions back
- Just output the improved text directly`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: content }
                    ],
                    temperature: 0.3,
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

    // Prompt building removed - now done inline in analyzeStreaming
}

