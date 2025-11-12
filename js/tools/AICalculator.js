// AI-Powered Calculator - Uses OpenAI function calling with real tools
import { MathTool } from './MathTool.js';
import { CurrencyTool } from './CurrencyTool.js';

export class AICalculator {
    constructor(openAIClient) {
        this.openAIClient = openAIClient;
    }

    async solve(expression, documentContext) {
        if (!this.openAIClient.apiKey) {
            console.error('AICalculator: No API key');
            return { success: false, error: 'No API key set' };
        }
        
        console.log('AICalculator: Solving expression:', expression);

        const tools = [
            {
                type: "function",
                function: {
                    name: "calculate_math",
                    description: "Calculate mathematical expressions. Handles percentages, basic arithmetic, and variables from context.",
                    parameters: {
                        type: "object",
                        properties: {
                            expression: {
                                type: "string",
                                description: "The mathematical expression to evaluate (e.g., '5 + 3', '100 * 0.05', 'x + 20')"
                            }
                        },
                        required: ["expression"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "convert_currency",
                    description: "Convert currency amounts between different currencies using real-time exchange rates.",
                    parameters: {
                        type: "object",
                        properties: {
                            amount: {
                                type: "number",
                                description: "The amount to convert"
                            },
                            from_currency: {
                                type: "string",
                                description: "Source currency code (e.g., EUR, USD, UAH, PLN)"
                            },
                            to_currency: {
                                type: "string",
                                description: "Target currency code (e.g., EUR, USD, UAH, PLN)"
                            }
                        },
                        required: ["amount", "from_currency", "to_currency"]
                    }
                }
            }
        ];

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.openAIClient.apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini', // Need a capable model for function calling
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a calculator assistant. Parse natural language math problems and call the appropriate function. Convert text numbers to digits (e.g., "two million" → 2000000).'
                        },
                        {
                            role: 'user',
                            content: `Context (may contain variables):\n${documentContext}\n\nSolve: ${expression}`
                        }
                    ],
                    tools: tools,
                    tool_choice: "auto",
                    temperature: 0
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Full AI response:', JSON.stringify(data, null, 2));
            
            const message = data.choices[0].message;
            console.log('AI message:', message);

            // Check if AI wants to call a function
            if (message.tool_calls && message.tool_calls.length > 0) {
                const toolCall = message.tool_calls[0];
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);

                console.log('AI calling function:', functionName, 'with args:', args);

                // Execute the function
                if (functionName === 'calculate_math') {
                    const variables = MathTool.extractVariables(documentContext);
                    const result = MathTool.evaluate(args.expression, variables);
                    return { success: true, answer: result.toString() };
                } else if (functionName === 'convert_currency') {
                    const result = await CurrencyTool.convert(
                        args.amount,
                        args.from_currency,
                        args.to_currency
                    );
                    if (result.success) {
                        const rounded = Math.round(result.amount * 100) / 100;
                        return { success: true, answer: rounded.toString() };
                    } else {
                        return { success: false, error: result.error };
                    }
                }
            }

            // If no function call, try to extract number from content
            if (message.content) {
                const content = message.content.trim();
                // Extract just the number if AI gave us text
                const numberMatch = content.match(/[\d,]+\.?\d*/);
                if (numberMatch) {
                    const number = numberMatch[0].replace(/,/g, '');
                    return { success: true, answer: number };
                }
                return { success: true, answer: content };
            }

            console.error('AI returned no tool call and no content');
            return { success: false, error: 'AI could not solve this' };
        } catch (error) {
            console.error('AI Calculator error:', error);
            return { success: false, error: error.message };
        }
    }
}

