import { Functionality } from './srsParser';

export class PromptsService {
    
    /**
     * Prompt for extracting functionalities from SRS document text
     */
    static getFunctionalityExtractionPrompt(text: string): string {
        return `You are an expert software requirements analyst. Your task is to extract implementable functionalities from a Software Requirements Specification (SRS) document.

SRS Document Text:
"""
${text}
"""

Please analyze this SRS document and extract all implementable functionalities. For each functionality, provide:

1. **Functionality Name**: A clear, concise name for the functionality
2. **Description**: A brief description of what the functionality does
3. **Context**: The business context and purpose of this functionality
4. **Requirements**: List of specific requirements for this functionality
5. **Use Cases**: Any use cases or scenarios mentioned for this functionality
6. **Diagrams**: Any references to diagrams, flowcharts, or visual representations

Focus on functionalities that can be implemented as software components, modules, or features. Ignore high-level system descriptions and focus on concrete, implementable functionalities.

Return your response in the following JSON format:
{
  "functionalities": [
    {
      "name": "Functionality Name",
      "description": "Brief description of what it does",
      "context": "Business context and purpose",
      "requirements": [
        "Requirement 1",
        "Requirement 2",
        "Requirement 3"
      ],
      "useCases": [
        "Use case 1",
        "Use case 2"
      ],
      "diagrams": [
        "Diagram reference 1",
        "Diagram reference 2"
      ]
    }
  ]
}

If no functionalities are found, return: {"functionalities": []}`;
    }

    /**
     * Prompt for generating code from functionality
     */
    static getCodeGenerationPrompt(functionality: Functionality): string {
        return `You are an expert software developer. Generate clean, production-ready JavaScript code for the following functionality.

FUNCTIONALITY DETAILS:
- Name: ${functionality.name}
- Description: ${functionality.description}
- Context: ${functionality.context}

REQUIREMENTS:
${functionality.requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

${functionality.useCases && functionality.useCases.length > 0 ? `
USE CASES:
${functionality.useCases.map((useCase, index) => `${index + 1}. ${useCase}`).join('\n')}
` : ''}

${functionality.diagrams && functionality.diagrams.length > 0 ? `
DIAGRAM REFERENCES:
${functionality.diagrams.map((diagram, index) => `${index + 1}. ${diagram}`).join('\n')}
` : ''}

Please generate a complete JavaScript implementation that includes:

1. **Main Class/Function**: A well-structured class or function for this functionality
2. **Error Handling**: Comprehensive error handling and validation
3. **Input Validation**: Proper validation of input parameters
4. **Documentation**: Clear comments explaining the code logic
5. **Example Usage**: Include example usage in comments
6. **Export Statements**: Proper module exports for reusability
7. **Best Practices**: Follow JavaScript best practices and conventions

The code should be:
- Production-ready and well-tested
- Modular and reusable
- Easy to understand and maintain
- Include proper error messages
- Handle edge cases appropriately

Generate only the JavaScript code without any additional explanations or markdown formatting.`;
    }

    /**
     * Prompt for improving extracted functionalities
     */
    static getFunctionalityImprovementPrompt(functionalities: Functionality[]): string {
        return `You are an expert software requirements analyst. Review and improve the following extracted functionalities from an SRS document.

EXTRACTED FUNCTIONALITIES:
${functionalities.map((func, index) => `
${index + 1}. **${func.name}**
   - Description: ${func.description}
   - Context: ${func.context}
   - Requirements: ${func.requirements.join(', ')}
`).join('')}

Please review these functionalities and:

1. **Validate**: Ensure each functionality is implementable as software
2. **Improve**: Enhance descriptions and requirements for clarity
3. **Consolidate**: Merge similar or overlapping functionalities
4. **Complete**: Add missing requirements or context
5. **Prioritize**: Suggest implementation order based on dependencies

Return the improved functionalities in the same JSON format:
{
  "functionalities": [
    {
      "name": "Improved Functionality Name",
      "description": "Enhanced description",
      "context": "Improved context",
      "requirements": [
        "Enhanced requirement 1",
        "Enhanced requirement 2"
      ],
      "useCases": [
        "Use case 1",
        "Use case 2"
      ],
      "diagrams": [
        "Diagram reference 1"
      ]
    }
  ]
}`;
    }

    /**
     * Prompt for generating test cases
     */
    static getTestGenerationPrompt(functionality: Functionality): string {
        return `You are an expert software tester. Generate comprehensive test cases for the following functionality.

FUNCTIONALITY: ${functionality.name}
DESCRIPTION: ${functionality.description}
CONTEXT: ${functionality.context}
REQUIREMENTS: ${functionality.requirements.join(', ')}

Generate JavaScript test cases using Jest framework that cover:

1. **Happy Path Tests**: Normal operation scenarios
2. **Edge Cases**: Boundary conditions and edge cases
3. **Error Handling**: Invalid inputs and error scenarios
4. **Integration Tests**: Interaction with other components
5. **Performance Tests**: Basic performance considerations

Include test cases for:
- Valid inputs and expected outputs
- Invalid inputs and error handling
- Boundary conditions
- User interaction scenarios
- Data validation
- Security considerations

Return only the JavaScript test code without explanations.`;
    }

    /**
     * Prompt for generating API documentation
     */
    static getDocumentationPrompt(functionality: Functionality): string {
        return `You are an expert technical writer. Generate comprehensive API documentation for the following functionality.

FUNCTIONALITY: ${functionality.name}
DESCRIPTION: ${functionality.description}
CONTEXT: ${functionality.context}
REQUIREMENTS: ${functionality.requirements.join(', ')}

Generate documentation that includes:

1. **Overview**: Brief description of the functionality
2. **API Reference**: Method signatures and parameters
3. **Usage Examples**: Code examples showing how to use the functionality
4. **Parameters**: Detailed parameter descriptions
5. **Return Values**: Description of return values
6. **Error Handling**: Common errors and how to handle them
7. **Best Practices**: Recommendations for optimal usage

Format the documentation in Markdown.`;
    }

    /**
     * Prompt for code review and optimization
     */
    static getCodeReviewPrompt(code: string, functionality: Functionality): string {
        return `You are an expert code reviewer. Review the following JavaScript code for the functionality "${functionality.name}".

CODE TO REVIEW:
\`\`\`javascript
${code}
\`\`\`

FUNCTIONALITY REQUIREMENTS:
${functionality.requirements.map((req, index) => `${index + 1}. ${req}`).join('\n')}

Please provide a comprehensive code review covering:

1. **Code Quality**: Readability, maintainability, and structure
2. **Performance**: Efficiency and optimization opportunities
3. **Security**: Potential security vulnerabilities
4. **Error Handling**: Completeness of error handling
5. **Best Practices**: Adherence to JavaScript best practices
6. **Requirements Coverage**: How well the code meets the requirements
7. **Suggestions**: Specific improvements and optimizations

Provide actionable feedback and suggest specific improvements.`;
    }

    /**
     * Prompt for generating implementation plan
     */
    static getImplementationPlanPrompt(functionalities: Functionality[]): string {
        return `You are an expert software architect. Create an implementation plan for the following functionalities.

FUNCTIONALITIES:
${functionalities.map((func, index) => `
${index + 1}. **${func.name}**
   - Description: ${func.description}
   - Context: ${func.context}
   - Requirements: ${func.requirements.length} requirements
`).join('')}

Create a detailed implementation plan that includes:

1. **Dependencies**: Identify dependencies between functionalities
2. **Implementation Order**: Suggest the order of implementation
3. **Architecture**: Recommend architectural patterns and structure
4. **Technology Stack**: Suggest appropriate technologies and frameworks
5. **Timeline**: Estimate implementation time for each functionality
6. **Risks**: Identify potential risks and mitigation strategies
7. **Testing Strategy**: Approach for testing each functionality

Format the plan in a structured, actionable format.`;
    }
}






















