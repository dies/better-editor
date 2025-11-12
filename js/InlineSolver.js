// Inline Math and Question Solver with Real Tools
import { MathTool } from './tools/MathTool.js';
import { CurrencyTool } from './tools/CurrencyTool.js';

export class InlineSolver {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.processingLines = new Set();
        this.decorations = new Map(); // Track decorations per editor
        this.onStatusMessage = null;
    }

    async processLine(editor, lineNumber, lineContent) {
        // Check if line has = at the end (with possible whitespace)
        const hasEquals = /=\s*$/.test(lineContent);
        if (!hasEquals) {
            console.log('InlineSolver: No = at end');
            return;
        }

        // Extract the expression (everything before =)
        const expression = lineContent.replace(/=\s*$/, '').trim();
        console.log('InlineSolver: Processing expression:', expression);
        
        // Check if it's math or a question
        const isMath = this.isMathExpression(expression);
        const isQuestion = this.isQuestion(expression);
        
        console.log('InlineSolver: isMath=', isMath, 'isQuestion=', isQuestion);
        
        if (!isMath && !isQuestion) {
            console.log('InlineSolver: Not math or question, skipping');
            return;
        }

        // Avoid processing same line multiple times
        const lineKey = `${lineNumber}:${expression}`;
        if (this.processingLines.has(lineKey)) {
            console.log('InlineSolver: Already processing this line');
            return;
        }
        this.processingLines.add(lineKey);

        try {
            // Get full document for context (variables!)
            const fullDocument = editor.getValue();
            console.log('InlineSolver: Solving...');
            const result = await this.solve(expression, fullDocument, isMath);
            console.log('InlineSolver: Result:', result);
            
            if (result && result.success) {
                // Valid result - insert inline
                console.log('InlineSolver: Inserting answer:', result.answer);
                this.insertAnswer(editor, lineNumber, result.answer);
                this.clearDecoration(editor, lineNumber);
            } else if (result && result.error) {
                // Error - show decoration and status
                console.log('InlineSolver: Showing error:', result.error);
                this.showError(editor, lineNumber, expression, result.error);
            }
        } catch (error) {
            console.error('InlineSolver: Exception:', error);
        } finally {
            this.processingLines.delete(lineKey);
        }
    }

    isMathExpression(text) {
        // Check for math but NOT currency conversion
        const isCurrency = /\d+\s+[A-Z]{3}\s+(in|to)\s+[A-Z]{3}/i.test(text);
        const hasMath = /\d+\s*[\+\-\*\/]\s*\d+|%|sqrt|squared|cubed|\w+\s*[\+\-\*\/]/.test(text);
        return hasMath && !isCurrency;
    }

    isQuestion(text) {
        return /\d+\s+[A-Z]{3}\s+(in|to)\s+[A-Z]{3}/i.test(text);
    }

    async solve(expression, fullDocument, isMath) {
        try {
            if (isMath) {
                // Use REAL math tool (no AI needed!)
                const variables = MathTool.extractVariables(fullDocument);
                const result = MathTool.evaluate(expression, variables);
                return { success: true, answer: result.toString() };
            } else {
                // Currency conversion - use REAL API (no AI)
                const currencyMatch = expression.match(/(\d+\.?\d*)\s+([A-Z]{3})\s+(in|to)\s+([A-Z]{3})/i);
                if (currencyMatch) {
                    const [, amount, from, , to] = currencyMatch;
                    const result = await CurrencyTool.convert(parseFloat(amount), from, to);
                    
                    if (result.success) {
                        // Return ONLY the number, rounded to 2 decimals
                        const rounded = Math.round(result.amount * 100) / 100;
                        return { success: true, answer: rounded.toString() };
                    } else {
                        // API returned error
                        return { 
                            success: false, 
                            error: result.error
                        };
                    }
                }
            }
        } catch (error) {
            console.error('Solver error:', error);
            return { success: false, error: error.message };
        }
        
        return null;
    }

    async askAI(question) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAIClient.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { 
                            role: 'system', 
                            content: 'You are a calculator. Respond with ONLY a number or short factual answer. No words, no explanations, no units unless absolutely necessary.' 
                        },
                        { role: 'user', content: question }
                    ],
                    temperature: 0,
                    max_tokens: 20
                })
            });

            if (!response.ok) return null;

            const data = await response.json();
            let answer = data.choices[0].message.content.trim();
            
            // Extract only the number if possible
            const numberMatch = answer.match(/[\d.]+/);
            if (numberMatch) {
                return numberMatch[0];
            }
            
            return answer;
        } catch (error) {
            return null;
        }
    }

    insertAnswer(editor, lineNumber, answer) {
        const lineContent = editor.getModel().getLineContent(lineNumber);
        const lineLength = lineContent.length;

        // Insert answer after the = sign (no space)
        editor.executeEdits('inline-solver', [{
            range: {
                startLineNumber: lineNumber,
                startColumn: lineLength + 1,
                endLineNumber: lineNumber,
                endColumn: lineLength + 1
            },
            text: answer
        }]);
    }

    showError(editor, lineNumber, expression, errorMessage) {
        const lineContent = editor.getModel().getLineContent(lineNumber);
        const startCol = lineContent.indexOf(expression) + 1;
        const endCol = startCol + expression.length;

        // Create decoration (red squiggly underline)
        const decorationIds = editor.deltaDecorations([], [
            {
                range: new monaco.Range(lineNumber, startCol, lineNumber, endCol),
                options: {
                    inlineClassName: 'inline-error',
                    hoverMessage: { value: errorMessage },
                    glyphMarginClassName: 'error-glyph'
                }
            }
        ]);

        // Store decoration IDs for this editor
        const editorId = editor.getId();
        if (!this.decorations.has(editorId)) {
            this.decorations.set(editorId, []);
        }
        this.decorations.get(editorId).push(...decorationIds);

        // Show in status bar
        if (this.onStatusMessage) {
            this.onStatusMessage(errorMessage);
        }
    }

    clearDecoration(editor, lineNumber) {
        const editorId = editor.getId();
        const decorationIds = this.decorations.get(editorId);
        
        if (decorationIds && decorationIds.length > 0) {
            editor.deltaDecorations(decorationIds, []);
            this.decorations.set(editorId, []);
        }
    }
}
