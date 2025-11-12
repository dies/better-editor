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
        
        // Look for variable definitions: varName = number
        const varPattern = /^([a-zA-Z_]\w*)\s*=\s*([\d.]+)\s*$/;
        
        for (const line of lines) {
            const match = line.match(varPattern);
            if (match) {
                const [, varName, value] = match;
                variables[varName] = parseFloat(value);
            }
        }
        
        return variables;
    }
}

