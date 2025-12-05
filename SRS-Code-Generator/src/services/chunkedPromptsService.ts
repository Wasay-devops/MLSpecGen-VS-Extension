import { Functionality } from './srsParser';

export class ChunkedPromptsService {
    
    /**
     * Prompt for extracting functionalities from SRS document chunks
     * This is optimized for processing individual chunks of a larger document
     */
    static getChunkedFunctionalityExtractionPrompt(chunk: string, chunkIndex: number, totalChunks: number): string {
        return `You are an expert software requirements analyst. You are processing a CHUNK of a larger Software Requirements Specification (SRS) document.

CHUNK INFORMATION:
- Chunk ${chunkIndex + 1} of ${totalChunks} total chunks
- This is a portion of a larger SRS document
- Focus on extracting functionalities from this specific section

SRS Document Chunk:
"""
${chunk}
"""

Please analyze this chunk and extract any implementable functionalities. For each functionality, provide:

1. **Functionality Name**: A clear, concise name for the functionality
2. **Description**: A brief description of what the functionality does
3. **Context**: The business context and purpose of this functionality
4. **Requirements**: List of specific requirements for this functionality
5. **Use Cases**: Any use cases or scenarios mentioned for this functionality
6. **Diagrams**: Any references to diagrams, flowcharts, or visual representations

IMPORTANT INSTRUCTIONS:
- Focus on functionalities that can be implemented as software components, modules, or features
- This is a chunk, so some context might be missing - extract what you can
- If a functionality seems incomplete, still include it with available information
- Look for section headers, numbered lists, and bullet points that indicate functionalities
- Pay attention to words like "functionality", "feature", "module", "component", "system shall", "system must"

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

If no functionalities are found in this chunk, return: {"functionalities": []}`;
    }

    /**
     * Prompt for merging and deduplicating functionalities from multiple chunks
     */
    static getFunctionalityMergingPrompt(functionalities: Functionality[]): string {
        return `You are an expert software requirements analyst. You need to merge and deduplicate functionalities extracted from multiple chunks of an SRS document.

EXTRACTED FUNCTIONALITIES FROM ALL CHUNKS:
${functionalities.map((func, index) => `
${index + 1}. **${func.name}**
   - Description: ${func.description}
   - Context: ${func.context}
   - Requirements: ${func.requirements.join(', ')}
   - Use Cases: ${func.useCases?.join(', ') || 'None'}
   - Diagrams: ${func.diagrams?.join(', ') || 'None'}
`).join('')}

Please merge and deduplicate these functionalities:

1. **Identify Duplicates**: Find functionalities that refer to the same feature/module
2. **Merge Information**: Combine requirements, use cases, and context from duplicate entries
3. **Enhance Descriptions**: Improve descriptions with combined information
4. **Remove Redundancy**: Eliminate duplicate requirements and use cases
5. **Maintain Completeness**: Ensure no important information is lost

Return your response in the following JSON format:
{
  "functionalities": [
    {
      "name": "Merged Functionality Name",
      "description": "Enhanced description combining all information",
      "context": "Combined business context and purpose",
      "requirements": [
        "Unique requirement 1",
        "Unique requirement 2",
        "Unique requirement 3"
      ],
      "useCases": [
        "Unique use case 1",
        "Unique use case 2"
      ],
      "diagrams": [
        "Unique diagram reference 1",
        "Unique diagram reference 2"
      ]
    }
  ]
}`;
    }

    /**
     * Prompt for validating and improving extracted functionalities
     */
    static getFunctionalityValidationPrompt(functionalities: Functionality[]): string {
        return `You are an expert software requirements analyst. You need to validate and improve functionalities extracted from an SRS document.

EXTRACTED FUNCTIONALITIES:
${functionalities.map((func, index) => `
${index + 1}. **${func.name}**
   - Description: ${func.description}
   - Context: ${func.context}
   - Requirements: ${func.requirements.join(', ')}
   - Use Cases: ${func.useCases?.join(', ') || 'None'}
`).join('')}

Please validate and improve these functionalities:

1. **Validate Implementability**: Ensure each functionality can be implemented as software
2. **Improve Names**: Make functionality names clear and descriptive
3. **Enhance Descriptions**: Improve descriptions for clarity and completeness
4. **Consolidate Requirements**: Merge similar requirements and remove duplicates
5. **Add Missing Context**: Fill in missing business context where possible
6. **Remove Non-Implementable**: Remove high-level system descriptions that aren't implementable

Return your response in the following JSON format:
{
  "functionalities": [
    {
      "name": "Improved Functionality Name",
      "description": "Enhanced description",
      "context": "Complete business context",
      "requirements": [
        "Consolidated requirement 1",
        "Consolidated requirement 2"
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
     * Prompt for extracting functionalities from a specific section of an SRS document
     */
    static getSectionSpecificPrompt(sectionText: string, sectionName: string): string {
        return `You are an expert software requirements analyst. You are analyzing a specific section of an SRS document.

SECTION: ${sectionName}

SECTION TEXT:
"""
${sectionText}
"""

Please extract implementable functionalities from this specific section. Focus on:

1. **Section-Specific Functionalities**: Look for functionalities mentioned in this section
2. **Detailed Requirements**: Extract specific requirements mentioned in this section
3. **Use Cases**: Find use cases or scenarios described in this section
4. **Technical Details**: Look for technical specifications and implementation details

Return your response in the following JSON format:
{
  "functionalities": [
    {
      "name": "Functionality Name",
      "description": "Description specific to this section",
      "context": "Context from this section",
      "requirements": [
        "Section-specific requirement 1",
        "Section-specific requirement 2"
      ],
      "useCases": [
        "Use case from this section"
      ],
      "diagrams": [
        "Diagram reference from this section"
      ]
    }
  ]
}

If no functionalities are found in this section, return: {"functionalities": []}`;
    }
}






















