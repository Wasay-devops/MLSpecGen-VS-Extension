# 📋 CHUNKED LLM PROMPTS FOR SRS PARSING

## 🔧 **PROMPT FOR PROCESSING INDIVIDUAL CHUNKS**

### **📝 CHUNKED FUNCTIONALITY EXTRACTION PROMPT:**

```typescript
// This is the prompt sent to LLM for each chunk
`You are an expert software requirements analyst. You are processing a CHUNK of a larger Software Requirements Specification (SRS) document.

CHUNK INFORMATION:
- Chunk ${chunkIndex + 1} of ${totalChunks} total chunks
- This is a portion of a larger SRS document
- Focus on extracting functionalities from this specific section

SRS Document Chunk:
"""
${chunk}  // ← ONLY THE CHUNK TEXT, NOT THE WHOLE PDF
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

If no functionalities are found in this chunk, return: {"functionalities": []}`
```

## 🔄 **PROMPT FOR MERGING CHUNK RESULTS**

### **📝 FUNCTIONALITY MERGING PROMPT:**

```typescript
// This prompt is used to merge results from multiple chunks
`You are an expert software requirements analyst. You need to merge and deduplicate functionalities extracted from multiple chunks of an SRS document.

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
}`
```

## 🎯 **KEY DIFFERENCES FROM WHOLE PDF PROMPT:**

### **1. CHUNK AWARENESS:**
- **Chunk Information**: Tells LLM it's processing a chunk, not the whole document
- **Context Awareness**: Acknowledges that some context might be missing
- **Incomplete Data**: Instructs to extract what's available even if incomplete

### **2. FOCUSED EXTRACTION:**
- **Section-Specific**: Focuses on functionalities in the current chunk
- **Header Recognition**: Looks for section headers and numbered lists
- **Keyword Detection**: Searches for specific keywords like "functionality", "feature", "module"

### **3. MERGING INSTRUCTIONS:**
- **Duplicate Detection**: Identifies functionalities that refer to the same feature
- **Information Combination**: Merges requirements, use cases, and context
- **Redundancy Removal**: Eliminates duplicate information

## 📊 **CHUNKED PROCESSING FLOW:**

```
Large PDF Document
    ↓
Split into Chunks (3000 tokens each)
    ↓
┌─────────────────┬─────────────────┬─────────────────┐
│   CHUNK 1       │   CHUNK 2       │   CHUNK 3       │
│                 │                 │                 │
│ Chunk Prompt    │ Chunk Prompt    │ Chunk Prompt    │
│ (Chunk 1 of 3)  │ (Chunk 2 of 3)  │ (Chunk 3 of 3)  │
│                 │                 │                 │
│ LLM Analysis    │ LLM Analysis    │ LLM Analysis    │
│                 │                 │                 │
│ JSON Response   │ JSON Response   │ JSON Response   │
└─────────────────┴─────────────────┴─────────────────┘
    ↓
Collect All Results
    ↓
Merging Prompt (Deduplicate & Merge)
    ↓
Final Functionalities Array
```

## 🔧 **IMPLEMENTATION:**

```typescript
// For each chunk
const prompt = ChunkedPromptsService.getChunkedFunctionalityExtractionPrompt(
    chunk, 
    chunkIndex, 
    totalChunks
);

// After processing all chunks
const mergingPrompt = ChunkedPromptsService.getFunctionalityMergingPrompt(
    allFunctionalities
);
```

## ✅ **ADVANTAGES OF CHUNKED PROMPTS:**

1. **Token Efficiency**: Each chunk stays within token limits
2. **Context Awareness**: LLM knows it's processing a chunk
3. **Focused Analysis**: Better attention to details in each chunk
4. **Merging Intelligence**: Smart deduplication and merging
5. **Scalability**: Handles documents of any size

**This chunked approach with specialized prompts is much more effective for large SRS documents!** 🚀






















