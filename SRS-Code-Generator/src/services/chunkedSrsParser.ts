import * as fs from 'fs';
import * as path from 'path';
import pdf from 'pdf-parse';
import axios from 'axios';
import { PromptsService } from './promptsService';
import { Functionality } from './srsParser';

export class ChunkedSRSDocumentParser {
    private apiKey: string;
    private baseUrl: string;
    private maxChunkSize: number = 3000; // tokens
    private overlapSize: number = 200; // tokens for context overlap

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
            
            // Check if we need chunking
            const estimatedTokens = this.estimateTokens(textContent);
            
            if (estimatedTokens <= this.maxChunkSize) {
                // Small document - process as whole
                return await this.processWholeDocument(textContent);
            } else {
                // Large document - process in chunks
                return await this.processChunkedDocument(textContent);
            
        } catch (error) {
            throw new Error(`Failed to parse SRS document: ${error}`);
        }
    }

    private async processWholeDocument(text: string): Promise<Functionality[]> {
        if (this.apiKey) {
            try {
                return await this.extractFunctionalitiesWithLLM(text);
            } catch (error) {
                console.warn('LLM extraction failed, falling back to pattern-based extraction:', error);
                return this.extractFunctionalities(text);
            }
        } else {
            return this.extractFunctionalities(text);
        }
    }

    private async processChunkedDocument(text: string): Promise<Functionality[]> {
        const chunks = this.splitTextIntoChunks(text);
        const allFunctionalities: Functionality[] = [];
        
        console.log(`Processing ${chunks.length} chunks...`);
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`Processing chunk ${i + 1}/${chunks.length}...`);
            
            try {
                let chunkFunctionalities: Functionality[] = [];
                
                if (this.apiKey) {
                    try {
                        chunkFunctionalities = await this.extractFunctionalitiesWithLLM(chunk);
                    } catch (error) {
                        console.warn(`LLM extraction failed for chunk ${i + 1}, using pattern-based:`, error);
                        chunkFunctionalities = this.extractFunctionalities(chunk);
                    }
                } else {
                    chunkFunctionalities = this.extractFunctionalities(chunk);
                }
                
                allFunctionalities.push(...chunkFunctionalities);
                
                // Add small delay to avoid rate limiting
                if (i < chunks.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                console.error(`Error processing chunk ${i + 1}:`, error);
                // Continue with next chunk
            }
        }
        
        // Deduplicate and merge similar functionalities
        return this.deduplicateFunctionalities(allFunctionalities);
    }

    private splitTextIntoChunks(text: string): string[] {
        const chunks: string[] = [];
        const words = text.split(/\s+/);
        const wordsPerChunk = Math.floor(this.maxChunkSize / 1.3); // Rough estimation
        const overlapWords = Math.floor(this.overlapSize / 1.3);
        
        for (let i = 0; i < words.length; i += wordsPerChunk - overlapWords) {
            const chunkWords = words.slice(i, i + wordsPerChunk);
            const chunk = chunkWords.join(' ');
            
            if (chunk.trim().length > 0) {
                chunks.push(chunk);
            }
        }
        
        return chunks;
    }

    private deduplicateFunctionalities(functionalities: Functionality[]): Functionality[] {
        const uniqueFunctionalities: Functionality[] = [];
        const seenNames = new Set<string>();
        
        for (const func of functionalities) {
            const normalizedName = func.name.toLowerCase().trim();
            
            if (!seenNames.has(normalizedName)) {
                seenNames.add(normalizedName);
                uniqueFunctionalities.push(func);
            } else {
                // Merge with existing functionality
                const existingIndex = uniqueFunctionalities.findIndex(
                    f => f.name.toLowerCase().trim() === normalizedName
                );
                
                if (existingIndex !== -1) {
                    const existing = uniqueFunctionalities[existingIndex];
                    // Merge requirements and use cases
                    existing.requirements = [...new Set([...existing.requirements, ...func.requirements])];
                    if (func.useCases) {
                        existing.useCases = [...new Set([...(existing.useCases || []), ...func.useCases])];
                    }
                    if (func.diagrams) {
                        existing.diagrams = [...new Set([...(existing.diagrams || []), ...func.diagrams])];
                    }
                }
            }
        }
        
        return uniqueFunctionalities;
    }

    private estimateTokens(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(text.length / 4);
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
        // Fallback pattern-based extraction
        const functionalities: Functionality[] = [];
        
        // Simple pattern matching for fallback
        const functionalityPatterns = [
            /(?:Functionality|Feature|Module|Component)\s*[:\-]?\s*([^\n]+)/gi,
            /(\w+(?:\s+\w+)*)\s*(?:functionality|feature|module|component)/gi
        ];
        
        for (const pattern of functionalityPatterns) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const name = match[1] || match[0];
                if (name.trim().length > 3) {
                    functionalities.push({
                        name: name.trim(),
                        context: this.extractContext(text, name),
                        description: name.trim(),
                        requirements: this.extractRequirements(text, name),
                        useCases: [],
                        diagrams: []
                    });
                }
            }
        }
        
        return functionalities;
    }

    private extractContext(text: string, functionalityName: string): string {
        // Extract context around the functionality
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(functionalityName.toLowerCase())) {
                const start = Math.max(0, i - 2);
                const end = Math.min(lines.length, i + 3);
                return lines.slice(start, end).join(' ').trim();
            }
        }
        return functionalityName;
    }

    private extractRequirements(text: string, functionalityName: string): string[] {
        const requirements: string[] = [];
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






















