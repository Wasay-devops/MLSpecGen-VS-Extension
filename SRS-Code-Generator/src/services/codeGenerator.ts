import { Functionality } from './srsParser';
import axios from 'axios';
import { PromptsService } from './promptsService';

export class CodeGenerator {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        // You can set these via environment variables or configuration
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    }

    async generateCode(functionality: Functionality): Promise<string> {
        try {
            // If no API key is configured, generate a template
            if (!this.apiKey) {
                return this.generateTemplateCode(functionality);
            }

            // Use LLM to generate code
            return await this.generateCodeWithLLM(functionality);
        } catch (error) {
            console.error('Error generating code:', error);
            // Fallback to template generation
            return this.generateTemplateCode(functionality);
        }
    }

    private async generateCodeWithLLM(functionality: Functionality): Promise<string> {
        const prompt = PromptsService.getCodeGenerationPrompt(functionality);
        
        try {
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: 'gpt-4',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software developer. Generate production-ready JavaScript code based on the provided functionality requirements. Focus on clean, maintainable, and well-documented code.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.3
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                }
            });

            if (response.status !== 200) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            const data = response.data;
            return data.choices[0].message.content;
        } catch (error) {
            console.error('LLM API error:', error);
            throw error;
        }
    }

    private buildPrompt(functionality: Functionality): string {
        let prompt = `Generate JavaScript code for the following functionality:\n\n`;
        prompt += `Functionality Name: ${functionality.name}\n\n`;
        prompt += `Description: ${functionality.description}\n\n`;
        prompt += `Context: ${functionality.context}\n\n`;

        if (functionality.requirements && functionality.requirements.length > 0) {
            prompt += `Requirements:\n`;
            functionality.requirements.forEach((req, index) => {
                prompt += `${index + 1}. ${req}\n`;
            });
            prompt += `\n`;
        }

        if (functionality.useCases && functionality.useCases.length > 0) {
            prompt += `Use Cases:\n`;
            functionality.useCases.forEach((useCase, index) => {
                prompt += `${index + 1}. ${useCase}\n`;
            });
            prompt += `\n`;
        }

        prompt += `Please generate a complete JavaScript implementation that includes:\n`;
        prompt += `1. A main function or class for this functionality\n`;
        prompt += `2. Proper error handling\n`;
        prompt += `3. Input validation\n`;
        prompt += `4. Clear comments explaining the code\n`;
        prompt += `5. Export statements if needed\n`;
        prompt += `6. Example usage if applicable\n\n`;
        prompt += `Make the code production-ready and well-documented.`;

        return prompt;
    }

    private generateTemplateCode(functionality: Functionality): string {
        const functionName = this.sanitizeFunctionName(functionality.name);
        
        let code = `/**
 * ${functionality.name}
 * 
 * Description: ${functionality.description}
 * Context: ${functionality.context}
 */

`;

        // Add requirements as comments
        if (functionality.requirements && functionality.requirements.length > 0) {
            code += `/**
 * Requirements:
${functionality.requirements.map(req => ` * - ${req}`).join('\n')}
 */

`;
        }

        // Add use cases as comments
        if (functionality.useCases && functionality.useCases.length > 0) {
            code += `/**
 * Use Cases:
${functionality.useCases.map(useCase => ` * - ${useCase}`).join('\n')}
 */

`;
        }

        // Generate the main function/class
        code += `class ${functionName} {
    constructor() {
        // Initialize the functionality
        this.initialized = false;
    }

    /**
     * Initialize the functionality
     */
    async initialize() {
        try {
            // Add initialization logic here
            console.log('Initializing ${functionality.name}...');
            
            // TODO: Implement initialization based on requirements
            // ${functionality.requirements.join('\n            // ')}
            
            this.initialized = true;
            console.log('${functionality.name} initialized successfully');
        } catch (error) {
            console.error('Error initializing ${functionality.name}:', error);
            throw error;
        }
    }

    /**
     * Main functionality implementation
     * @param {Object} params - Input parameters
     * @returns {Promise<Object>} Result of the functionality
     */
    async execute(params = {}) {
        if (!this.initialized) {
            throw new Error('${functionality.name} not initialized. Call initialize() first.');
        }

        try {
            // Validate input parameters
            this.validateInput(params);

            // TODO: Implement main functionality logic
            // Based on requirements: ${functionality.requirements.join(', ')}

            const result = {
                success: true,
                data: {},
                message: '${functionality.name} executed successfully'
            };

            return result;
        } catch (error) {
            console.error('Error executing ${functionality.name}:', error);
            throw error;
        }
    }

    /**
     * Validate input parameters
     * @param {Object} params - Parameters to validate
     */
    validateInput(params) {
        // TODO: Add specific validation based on requirements
        if (!params || typeof params !== 'object') {
            throw new Error('Invalid parameters provided');
        }
    }

    /**
     * Get functionality status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            name: '${functionality.name}',
            initialized: this.initialized,
            description: '${functionality.description}',
            context: '${functionality.context}'
        };
    }
}

// Export the functionality
module.exports = ${functionName};

// Example usage:
/*
const ${functionName.toLowerCase()} = new ${functionName}();

async function example() {
    try {
        await ${functionName.toLowerCase()}.initialize();
        const result = await ${functionName.toLowerCase()}.execute({});
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

// Uncomment to run example
// example();
*/`;

        return code;
    }

    private sanitizeFunctionName(name: string): string {
        // Convert to valid JavaScript class/function name
        return name
            .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('')
            .replace(/^[0-9]/, '_$&'); // Handle names starting with numbers
    }
}
