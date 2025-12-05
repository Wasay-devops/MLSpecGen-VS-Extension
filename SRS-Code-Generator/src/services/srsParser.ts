import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import axios from 'axios';
import { PromptsService } from './promptsService';

export interface Functionality {
    name: string;
    context: string;
    description: string;
    requirements: string[];
    useCases?: string[];
    diagrams?: string[];
}

export class SRSDocumentParser {
    private apiKey: string;
    private baseUrl: string;

    constructor() {
        this.apiKey = process.env.OPENAI_API_KEY || '';
        this.baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    }
    
    async parseSRSDocument(filePath: string): Promise<Functionality[]> {
        try {
            // Read and parse the PDF file
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdf(dataBuffer);
            
            // Extract text content
            const textContent = pdfData.text;
            
            // Try LLM-based extraction first, fallback to pattern-based
            let functionalities: Functionality[] = [];
            
            if (this.apiKey) {
                try {
                    functionalities = await this.extractFunctionalitiesWithLLM(textContent);
                } catch (error) {
                    console.warn('LLM extraction failed, falling back to pattern-based extraction:', error);
                    functionalities = this.extractFunctionalities(textContent);
                }
            } else {
                functionalities = this.extractFunctionalities(textContent);
            }
            
            return functionalities;
            
        } catch (error) {
            throw new Error(`Failed to parse SRS document: ${error}`);
        }
    }

    private async extractFunctionalitiesWithLLM(text: string): Promise<Functionality[]> {
        try {
            const prompt = PromptsService.getFunctionalityExtractionPrompt(text);
            
            const response = await axios.post(`${this.baseUrl}/chat/completions`, {
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software requirements analyst. Extract functionalities from SRS documents and return valid JSON.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 3000,
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
            const responseText = data.choices[0].message.content;
            
            // Parse JSON response
            try {
                const parsed = JSON.parse(responseText);
                return parsed.functionalities || [];
            } catch (parseError) {
                console.warn('Failed to parse LLM response as JSON:', parseError);
                return this.extractFunctionalities(text);
            }
            
        } catch (error) {
            console.error('LLM extraction error:', error);
            throw error;
        }
    }
    
    private extractFunctionalities(text: string): Functionality[] {
        const functionalities: Functionality[] = [];
        
        // Split text into sections
        const sections = this.splitIntoSections(text);
        
        // Extract functionalities from each section
        for (const section of sections) {
            const functionality = this.parseFunctionalityFromSection(section);
            if (functionality) {
                functionalities.push(functionality);
            }
        }
        
        // If no functionalities found through section parsing, try alternative methods
        if (functionalities.length === 0) {
            const altFunctionalities = this.extractFunctionalitiesAlternative(text);
            functionalities.push(...altFunctionalities);
        }
        
        return functionalities;
    }
    
    private splitIntoSections(text: string): string[] {
        // Split by common SRS section headers
        const sectionPatterns = [
            /(?:^|\n)\s*(?:Functionality|Feature|Use Case|Requirement|Module)\s*[:\-\d]/gmi,
            /(?:^|\n)\s*\d+\.\d+\s+[A-Z][^.\n]*/g,
            /(?:^|\n)\s*[A-Z][A-Z\s]+[:\-]/g
        ];
        
        const sections: string[] = [];
        let lastIndex = 0;
        
        for (const pattern of sectionPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    sections.push(text.substring(lastIndex, match.index).trim());
                }
                lastIndex = match.index;
            }
        }
        
        // Add remaining text
        if (lastIndex < text.length) {
            sections.push(text.substring(lastIndex).trim());
        }
        
        return sections.filter(section => section.length > 50);
    }
    
    private parseFunctionalityFromSection(section: string): Functionality | null {
        // Look for functionality patterns
        const functionalityPatterns = [
            /(?:Functionality|Feature|Module|Component)\s*[:\-]?\s*([^\n]+)/i,
            /(\w+(?:\s+\w+)*)\s*(?:functionality|feature|module|component)/i,
            /(?:The\s+)?(\w+(?:\s+\w+)*)\s*(?:shall|should|must|will)\s+(?:provide|implement|support|handle)/i
        ];
        
        let functionalityName = '';
        for (const pattern of functionalityPatterns) {
            const match = section.match(pattern);
            if (match && match[1]) {
                functionalityName = match[1].trim();
                break;
            }
        }
        
        if (!functionalityName) {
            return null;
        }
        
        // Extract context and requirements
        const context = this.extractContext(section);
        const requirements = this.extractRequirements(section);
        const useCases = this.extractUseCases(section);
        const diagrams = this.extractDiagrams(section);
        
        return {
            name: functionalityName,
            context: context,
            description: this.extractDescription(section),
            requirements: requirements,
            useCases: useCases,
            diagrams: diagrams
        };
    }
    
    private extractFunctionalitiesAlternative(text: string): Functionality[] {
        const functionalities: Functionality[] = [];
        
        // Look for numbered lists or bullet points that might be functionalities
        const listPatterns = [
            /(?:^|\n)\s*[\d\-\*]\s+([A-Z][^.\n]*(?:functionality|feature|module|component)[^.\n]*)/gi,
            /(?:^|\n)\s*[\d\-\*]\s+([A-Z][^.\n]*(?:shall|should|must|will)\s+(?:provide|implement|support|handle)[^.\n]*)/gi
        ];
        
        for (const pattern of listPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const name = match[1].trim();
                if (name.length > 5 && name.length < 100) {
                    functionalities.push({
                        name: name,
                        context: this.extractContextFromText(text, name),
                        description: name,
                        requirements: this.extractRequirementsFromText(text, name),
                        useCases: [],
                        diagrams: []
                    });
                }
            }
        }
        
        return functionalities;
    }
    
    private extractContext(section: string): string {
        // Extract context around the functionality
        const contextPatterns = [
            /(?:context|background|overview|description)[:\-]?\s*([^.\n]+)/i,
            /(?:this\s+)?(?:functionality|feature|module|component)\s+(?:is|will|shall|should)\s+([^.\n]+)/i
        ];
        
        for (const pattern of contextPatterns) {
            const match = section.match(pattern);
            if (match && match[1]) {
                return match[1].trim();
            }
        }
        
        // Fallback: use first few sentences
        const sentences = section.split(/[.!?]+/).slice(0, 3);
        return sentences.join('. ').trim();
    }
    
    private extractRequirements(section: string): string[] {
        const requirements: string[] = [];
        
        // Look for requirement patterns
        const requirementPatterns = [
            /(?:requirement|req)[:\-]?\s*([^.\n]+)/gi,
            /(?:shall|should|must|will)\s+([^.\n]+)/gi,
            /(?:the\s+system\s+shall|the\s+system\s+should|the\s+system\s+must|the\s+system\s+will)\s+([^.\n]+)/gi
        ];
        
        for (const pattern of requirementPatterns) {
            let match;
            while ((match = pattern.exec(section)) !== null) {
                if (match[1] && match[1].trim().length > 10) {
                    requirements.push(match[1].trim());
                }
            }
        }
        
        return requirements;
    }
    
    private extractUseCases(section: string): string[] {
        const useCases: string[] = [];
        
        // Look for use case patterns
        const useCasePatterns = [
            /(?:use\s+case|scenario)[:\-]?\s*([^.\n]+)/gi,
            /(?:when|if)\s+([^.\n]+)/gi
        ];
        
        for (const pattern of useCasePatterns) {
            let match;
            while ((match = pattern.exec(section)) !== null) {
                if (match[1] && match[1].trim().length > 5) {
                    useCases.push(match[1].trim());
                }
            }
        }
        
        return useCases;
    }
    
    private extractDiagrams(section: string): string[] {
        const diagrams: string[] = [];
        
        // Look for diagram references
        const diagramPatterns = [
            /(?:figure|diagram|chart|flowchart)\s+[\d\.]+[:\-]?\s*([^.\n]+)/gi,
            /(?:see|refer\s+to)\s+(?:figure|diagram|chart)\s+[\d\.]+/gi
        ];
        
        for (const pattern of diagramPatterns) {
            let match;
            while ((match = pattern.exec(section)) !== null) {
                if (match[1] && match[1].trim().length > 5) {
                    diagrams.push(match[1].trim());
                }
            }
        }
        
        return diagrams;
    }
    
    private extractDescription(section: string): string {
        // Extract the first meaningful sentence as description
        const sentences = section.split(/[.!?]+/);
        for (const sentence of sentences) {
            if (sentence.trim().length > 20 && sentence.trim().length < 200) {
                return sentence.trim();
            }
        }
        
        return section.substring(0, 200).trim();
    }
    
    private extractContextFromText(text: string, functionalityName: string): string {
        // Find the section containing this functionality and extract context
        const lines = text.split('\n');
        let context = '';
        
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(functionalityName.toLowerCase())) {
                // Get surrounding context
                const start = Math.max(0, i - 2);
                const end = Math.min(lines.length, i + 5);
                context = lines.slice(start, end).join(' ').trim();
                break;
            }
        }
        
        return context || functionalityName;
    }
    
    private extractRequirementsFromText(text: string, functionalityName: string): string[] {
        const requirements: string[] = [];
        
        // Look for requirements related to this functionality
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.toLowerCase().includes(functionalityName.toLowerCase()) && 
                (line.includes('shall') || line.includes('should') || line.includes('must'))) {
                requirements.push(line.trim());
            }
        }
        
        return requirements;
    }
}
