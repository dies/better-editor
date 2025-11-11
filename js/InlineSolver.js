// Inline Math and Question Solver
export class InlineSolver {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.processingLines = new Set();
    }

    async processLine(editor, lineNumber, lineContent) {
        // Check if line has = at the end (with possible whitespace)
        const hasEquals = /=\s*$/.test(lineContent);
        if (!hasEquals) return;

        // Extract the expression (everything before =)
        const expression = lineContent.replace(/=\s*$/, '').trim();
        
        // Check if it's math or a question
        const isMath = this.isMathExpression(expression);
        const isQuestion = this.isQuestion(expression);
        
        if (!isMath && !isQuestion) return;

        // Avoid processing same line multiple times
        const lineKey = `${lineNumber}:${expression}`;
        if (this.processingLines.has(lineKey)) return;
        this.processingLines.add(lineKey);

        try {
            const answer = await this.solve(expression, isMath);
            if (answer) {
                this.insertAnswer(editor, lineNumber, answer);
            }
        } finally {
            this.processingLines.delete(lineKey);
        }
    }

    isMathExpression(text) {
        return /\d+\s*[\+\-\*\/]\s*\d+|%|sqrt|squared|cubed/.test(text);
    }

    isQuestion(text) {
        return /\d+\s+[A-Z]{3}\s+(in|to)\s+[A-Z]{3}/i.test(text) || 
               /how much|what is|convert/i.test(text);
    }

    async solve(expression, isMath) {
        if (!this.openAIClient.apiKey) return null;

        try {
            const prompt = isMath 
                ? `Calculate: ${expression}\nRespond with ONLY the numeric answer, nothing else.`
                : `Answer: ${expression}\nRespond with ONLY the short answer, nothing else.`;

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAIClient.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo', // Use fastest model for inline solving
                    messages: [
                        { role: 'system', content: 'You are a calculator and question answerer. Respond with ONLY the answer, no explanations.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.1,
                    max_tokens: 50
                })
            });

            if (!response.ok) return null;

            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Solver error:', error);
            return null;
        }
    }

    insertAnswer(editor, lineNumber, answer) {
        const lineContent = editor.getModel().getLineContent(lineNumber);
        const lineLength = lineContent.length;

        // Insert answer after the = sign
        editor.executeEdits('inline-solver', [{
            range: {
                startLineNumber: lineNumber,
                startColumn: lineLength + 1,
                endLineNumber: lineNumber,
                endColumn: lineLength + 1
            },
            text: ` ${answer}`
        }]);
    }
}

