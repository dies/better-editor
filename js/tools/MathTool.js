// Math Tool - Safe expression evaluation
export class MathTool {
    static evaluate(expression, variables = {}) {
        try {
            // Replace variables with values
            let expr = expression;
            for (const [key, value] of Object.entries(variables)) {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                expr = expr.replace(regex, value);
            }

            // Handle percentages: X + Y% means X + (X * Y/100)
            expr = expr.replace(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)%/g, (match, base, percent) => {
                return `${base} + (${base} * ${percent} / 100)`;
            });
            expr = expr.replace(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)%/g, (match, base, percent) => {
                return `${base} - (${base} * ${percent} / 100)`;
            });

            // Handle standalone percentages: Y% of X means (X * Y/100)
            expr = expr.replace(/(\d+\.?\d*)%\s*of\s*(\d+\.?\d*)/gi, (match, percent, base) => {
                return `(${base} * ${percent} / 100)`;
            });

            // Clean up the expression - allow only safe math
            expr = expr.replace(/[^0-9+\-*/(). ]/g, '');
            
            // Use Function constructor for safe evaluation (no access to scope)
            const result = Function(`'use strict'; return (${expr})`)();
            
            // Round to 2 decimal places if needed
            return Number.isInteger(result) ? result : Math.round(result * 100) / 100;
        } catch (error) {
            throw new Error(`Math error: ${error.message}`);
        }
    }

    static extractVariables(document) {
        const variables = {};
        const lines = document.split('\n');
        
        // Look for variable definitions in multiple formats:
        // 1. varName = number (e.g., x = 5)
        // 2. varName = expression=result (e.g., x = 3+3=6)
        // 3. varName = expression (e.g., total = price + tax)
        
        for (const line of lines) {
            // Pattern 1: variable = calculation=result
            // Extract the result after the last =
            const resultPattern = /^([a-zA-Z_][\w]*)\s*=\s*.+=\s*([\d.]+)\s*$/;
            const resultMatch = line.match(resultPattern);
            if (resultMatch) {
                const [, varName, value] = resultMatch;
                variables[varName] = parseFloat(value);
                continue;
            }
            
            // Pattern 2: variable = number
            const simplePattern = /^([a-zA-Z_][\w]*)\s*=\s*([\d.]+)\s*$/;
            const simpleMatch = line.match(simplePattern);
            if (simpleMatch) {
                const [, varName, value] = simpleMatch;
                variables[varName] = parseFloat(value);
                continue;
            }
            
            // Pattern 3: variable = expression (try to evaluate it with existing variables)
            const exprPattern = /^([a-zA-Z_][\w]*)\s*=\s*(.+)$/;
            const exprMatch = line.match(exprPattern);
            if (exprMatch) {
                const [, varName, expression] = exprMatch;
                try {
                    const result = this.evaluate(expression.trim(), variables);
                    variables[varName] = result;
                } catch (e) {
                    // Skip if can't evaluate
                }
            }
        }
        return variables;
    }
}

