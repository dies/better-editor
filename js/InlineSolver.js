// Inline Math and Question Solver with Real Tools + AI
import { MathTool } from './tools/MathTool.js';
import { CurrencyTool } from './tools/CurrencyTool.js';
import { AICalculator } from './tools/AICalculator.js';

export class InlineSolver {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
        this.aiCalculator = new AICalculator(openAIClient);
        this.processingLines = new Set();
        this.decorations = new Map();
        this.onStatusMessage = null;
        this.calculationCache = new Map(); // Cache line -> expression for recalc
    }

    async processLine(editor, lineNumber, lineContent) {
        // Simple approach: if line ends with =, let AI figure out the rest
        if (!/=\s*$/.test(lineContent)) {
            // Check if this line defines a variable - recalc dependent lines
            if (/^[a-zA-Z_][\w]*\s*=/.test(lineContent)) {
                console.log('Variable definition changed, recalculating document...');
                await this.recalculateDocument(editor);
            }
            return;
        }

        const expression = lineContent.replace(/=\s*$/, '').trim();
        console.log('InlineSolver: Processing:', expression);
        
        // Cache this calculation
        const editorId = editor.getId();
        const cacheKey = `${editorId}:${lineNumber}`;
        this.calculationCache.set(cacheKey, expression);
        
        // Avoid duplicates
        const lineKey = `${lineNumber}:${expression}`;
        if (this.processingLines.has(lineKey)) return;
        this.processingLines.add(lineKey);

        try {
            const fullDocument = editor.getValue();
            
            // Let AI parse and solve everything
            const result = await this.aiCalculator.solve(expression, fullDocument);
            console.log('InlineSolver: Result:', result);
            
            if (result && result.success) {
                this.insertAnswerAt(editor, lineNumber, lineContent.length, result.answer);
                this.clearDecoration(editor, lineNumber);
            } else if (result && result.error) {
                this.showError(editor, lineNumber, expression, result.error);
            }
        } catch (error) {
            console.error('InlineSolver: Exception:', error);
        } finally {
            this.processingLines.delete(lineKey);
        }
    }

    async recalculateDocument(editor) {
        const model = editor.getModel();
        const lineCount = model.getLineCount();
        
        // Find all lines with calculations (end with =)
        for (let i = 1; i <= lineCount; i++) {
            const lineContent = model.getLineContent(i);
            
            // If line ends with = (and possibly has a previous answer)
            if (lineContent.includes('=')) {
                // Extract the expression part (before any existing answer)
                const parts = lineContent.split('=');
                if (parts.length >= 2) {
                    // Has an existing answer - recalculate
                    const expression = parts[0].trim();
                    
                    // Clear the old answer
                    const newLine = expression + '=';
                    model.pushEditOperations([], [{
                        range: new monaco.Range(i, 1, i, lineContent.length + 1),
                        text: newLine
                    }], () => null);
                    
                    // Trigger recalculation
                    await this.processLine(editor, i, newLine);
                }
            }
        }
    }

    // All removed - AI handles everything now

    insertAnswerAt(editor, lineNumber, position, answer) {
        // Insert answer at specific position in the line
        editor.executeEdits('inline-solver', [{
            range: {
                startLineNumber: lineNumber,
                startColumn: position + 1,
                endLineNumber: lineNumber,
                endColumn: position + 1
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
