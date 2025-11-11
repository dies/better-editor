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

    async analyze(content, correctionPrompt, contentType) {
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
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    buildAnalysisPrompt(content, correctionPrompt, contentType) {
        let prompt = `Analyze the following text:\n\n${content}\n\n`;
        
        // Detect what kind of content this is
        const hasMath = /\d+\s*[\+\-\*\/]\s*\d+|%|sqrt|squared/.test(content);
        const hasQuestion = /\?|how much|what is|convert|in\s+[A-Z]{3}/i.test(content);
        
        if (hasMath) {
            prompt += '\n**Math Detection**: This content contains mathematical expressions. Calculate all results and explain your work.\n';
        }
        
        if (hasQuestion) {
            prompt += '\n**Question Detection**: This content contains questions. Answer them clearly and accurately. For currency conversions, provide current rates.\n';
        }
        
        prompt += `\n**Correction Task**: ${correctionPrompt}\n`;
        prompt += '\n**Output Format**: Provide your response in clean HTML with:';
        prompt += '\n- Use <h4> for section headings';
        prompt += '\n- Use <div class="math-result"> for math answers';
        prompt += '\n- Use <div class="answer"> for question answers';
        prompt += '\n- Use <div class="correction"> for text corrections';
        prompt += '\n- Keep it concise and helpful';
        
        return prompt;
    }
}

