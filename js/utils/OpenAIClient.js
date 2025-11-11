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
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [{ role: 'user', content: 'Hello' }],
                    max_tokens: 5
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error('API key verification failed:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('API key verification error:', error);
            return false;
        }
    }

    async chat(messages, temperature = 0.7) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages,
                temperature
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async complete(context, language, maxTokens = 100) {
        const prompt = `You are a code completion assistant. Given the following ${language} code context, suggest the next 1-3 words or code snippet that would logically follow. Return ONLY the suggestions as a JSON array of strings, nothing else.

Context:
${context}

Respond with JSON array only: ["suggestion1", "suggestion2", "suggestion3"]`;

        const content = await this.chat([
            { role: 'system', content: 'You are a helpful code completion assistant. Always respond with valid JSON arrays.' },
            { role: 'user', content: prompt }
        ], 0.3);

        try {
            const suggestions = JSON.parse(content.trim());
            return Array.isArray(suggestions) ? suggestions : [];
        } catch (e) {
            return [content];
        }
    }

    async improveCode(code, language, customPrompt = '') {
        const prompt = customPrompt || 
            `Improve and enhance the following ${language} code. Fix bugs, improve performance, add helpful comments, follow best practices, and make it more readable. Return ONLY the improved code, no explanations.`;

        const improvedCode = await this.chat([
            { role: 'system', content: 'You are an expert code reviewer and improver. Return only code, no markdown formatting, no explanations.' },
            { role: 'user', content: `${prompt}\n\n${code}` }
        ], 0.3);

        // Remove markdown code blocks if present
        return improvedCode.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();
    }
}

