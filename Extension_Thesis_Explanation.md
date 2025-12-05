# ML Contract Violation Detector - VS Code Extension
## Thesis Report Explanation

### Overview

The ML Contract Violation Detector is a sophisticated VS Code extension that leverages Retrieval-Augmented Generation (RAG) and Large Language Models (LLM) to automatically detect, classify, and generate executable contract specifications for Machine Learning API violations. This extension represents a practical implementation of research findings from the paper "Characterizing Machine Learning Contracts Using Large Language Models" and provides an automated solution for ML contract violation detection and remediation.

### Core Functionality

#### 1. **Automated ML Code Analysis**
- **Real-time Code Scanning**: The extension continuously monitors Python files for ML library usage patterns
- **Multi-library Support**: Detects violations across major ML frameworks including TensorFlow, Keras, PyTorch, and Scikit-learn
- **Pattern Recognition**: Identifies potential contract violations through static analysis of ML API usage patterns
- **Code Snippet Extraction**: Automatically extracts relevant code sections containing ML operations for detailed analysis

#### 2. **RAG-Powered Violation Detection**
- **Embedding-based Similarity**: Uses vector embeddings to find similar violation patterns from a pre-processed dataset of curated ML contract violation examples
- **Static Context Retrieval**: Leverages embedded research context and pre-analyzed examples to provide accurate violation classification
- **Multi-level Taxonomy**: Implements a hierarchical classification system with three levels:
  - **Level 1**: Central Contract Categories (SAM, AMO, Hybrid)
  - **Level 2**: Contract Subcategories (DT, BET, G, F, SAI, Selection)
  - **Level 3**: Hybrid Patterns (PT, BIT, RT, MT, IC-1, IC-2)

#### 3. **AI-Powered Contract Generation**
- **Executable PyContract Specifications**: Generates ready-to-use contract decorators using the PyContracts library
- **Natural Language Explanations**: Provides clear descriptions of contract preconditions and postconditions
- **Actionable Insights**: Offers specific remediation steps for developers
- **Code Generation**: Creates both buggy and fixed code examples demonstrating contract violations and solutions

### Technical Architecture

#### 1. **Extension Structure**
```
src/
├── extension.js              # Main extension entry point
├── rag/
│   ├── ragService.js         # RAG pipeline and GPT integration
│   └── embeddedData.js       # Curated dataset and research context
├── utils/
│   └── codeAnalyzer.js       # Python code analysis engine
├── services/
│   └── feedbackService.js    # LLM feedback loop for contract improvement
└── webview/
    ├── dashboardProvider.js  # Interactive dashboard provider
    ├── dashboard.js          # Frontend JavaScript
    └── dashboard.css         # Modern UI styling
```

#### 2. **RAG Service Implementation**
- **Embedding Generation**: Uses Ollama (nomic-embed-text) with OpenAI fallback for text embeddings
- **Similarity Search**: Implements cosine similarity for finding relevant examples from pre-embedded dataset
- **Static Context Integration**: Combines embedded research paper context, PyContracts documentation, and pre-analyzed violation examples
- **LLM Integration**: Uses GPT-4o for violation classification and contract generation

#### 3. **Code Analysis Engine**
- **ML Library Detection**: Identifies imports and API usage patterns for TensorFlow, Keras, PyTorch, and Scikit-learn
- **Violation Pattern Recognition**: Detects common ML contract violation patterns including:
  - Shape mismatches and dimension issues
  - Model lifecycle violations (training before prediction)
  - Data type inconsistencies
  - API method order violations
- **Snippet Extraction**: Extracts relevant code sections with ML operations for detailed analysis

### Research Foundation

#### 1. **Academic Basis**
The extension is built upon empirical research analyzing 413 ML API specifications from Stack Overflow posts, establishing a comprehensive taxonomy for ML contract violations. The research identified:

- **Central Contract Categories**: Single API Method (SAM), API Method Order (AMO), and Hybrid violations
- **Violation Patterns**: Data type mismatches, method order violations, and inter-argument contract issues
- **Impact Analysis**: Classification of effects including crashes, incorrect functionality, and performance degradation

#### 2. **Taxonomy Implementation**
The extension implements a three-level hierarchical taxonomy:

**Level 1 - Central Contract Categories:**
- **SAM**: Single API Method violations (argument constraints, method-specific requirements)
- **AMO**: API Method Order violations (incorrect sequence of API calls)
- **Hybrid**: Combination of behavioral and temporal contract violations

**Level 2 - Contract Subcategories:**
- **DT**: Data Type violations (incorrect argument types)
- **BET**: Boolean Expression Type violations (condition-related issues)
- **G**: Always temporal contracts (conditions that must always hold)
- **F**: Eventually temporal contracts (conditions that must hold at some point)
- **SAI**: SAM-AMO Interdependency violations
- **Selection**: Choice-based constraints

**Level 3 - Hybrid Patterns:**
- **PT**: Primitive Type violations (int, float, string issues)
- **BIT**: Built-in Type violations (list, dict, array issues)
- **RT**: Reference Type violations (object reference issues)
- **MT**: ML Type violations (tensor shape, model configuration issues)
- **IC-1**: Intra-argument Contract violations (single argument issues)
- **IC-2**: Inter-argument Contract violations (multiple argument relationship issues)

### User Interface and Experience

#### 1. **Interactive Dashboard**
- **Modern Web-based UI**: Clean, responsive interface built with HTML5, CSS3, and JavaScript
- **Real-time Analysis**: Live code analysis with progress indicators
- **Multi-modal Input**: Support for both file-based and direct code paste analysis
- **Detailed Violation Display**: Comprehensive violation information with explanations and remediation steps

#### 2. **Workflow Integration**
- **VS Code Integration**: Seamless integration with VS Code's command palette and context menus
- **File-based Analysis**: Analyze open Python files directly
- **Code Paste Support**: Analyze code snippets without saving to files
- **One-click Application**: Apply generated contracts directly to code files

#### 3. **Visualization Features**
- **Violation Classification Display**: Clear presentation of multi-level taxonomy labels
- **Code Comparison**: Side-by-side display of buggy vs. fixed code
- **Contract Specifications**: Natural language descriptions of contract requirements
- **Actionable Insights**: Specific steps for developers to resolve violations

### Advanced Features

#### 1. **Automated Contract Generation**
- **PyContract Integration**: Generates executable contract specifications using the PyContracts library
- **Natural Language Contracts**: Provides human-readable contract descriptions
- **Code Examples**: Creates both violating and compliant code examples
- **Validation Functions**: Generates validation code to check contract preconditions

#### 2. **LLM Feedback Loop**
- **Automatic Improvement**: Uses LLM feedback to refine generated contracts
- **Execution Validation**: Tests generated contracts for correctness
- **Iterative Enhancement**: Multiple rounds of improvement based on execution results
- **Error Handling**: Graceful fallback when contract generation fails

#### 3. **Virtual Environment Management**
- **Persistent Virtual Environment**: Maintains a persistent Python environment for code execution
- **Automatic Library Installation**: Detects and installs required ML libraries
- **Version Compatibility**: Ensures compatible library versions for stable execution
- **Code Execution**: Runs both buggy and fixed code examples in isolated environments

### Technical Implementation Details

#### 1. **RAG Pipeline**
```javascript
// Core RAG workflow
1. Code Analysis → Extract ML patterns and APIs
2. Embedding Generation → Create vector representation of user's code
3. Similarity Search → Find relevant examples from pre-embedded dataset
4. Context Assembly → Combine embedded research context and similar examples
5. LLM Classification → Generate violation labels using GPT-4o
6. Contract Generation → Create executable PyContract specifications
```

#### 2. **Embedding Strategy**
- **User Code Embedding**: Ollama with nomic-embed-text model for local embeddings of user's code
- **Fallback**: OpenAI text-embedding-3-small for cloud-based embeddings
- **Pre-embedded Dataset**: Uses pre-computed embeddings from curated violation examples
- **Dimension**: 768-dimensional vectors for similarity computation
- **Top-K Retrieval**: Retrieves top 5 most similar examples from embedded dataset

#### 3. **LLM Integration**
- **Model**: GPT-4o for high-quality classification and generation
- **Temperature**: 0.3 for consistent, deterministic outputs
- **Prompt Engineering**: Carefully crafted prompts for accurate violation classification
- **Response Parsing**: Robust extraction of structured labels from LLM responses

### Research Contributions

#### 1. **Empirical Foundation**
The extension is built upon a pre-processed dataset of ML contract violation examples, providing:
- **Comprehensive Coverage**: All major ML frameworks and common violation patterns
- **Pre-analyzed Examples**: Curated dataset of violation patterns with embedded vectors and classifications
- **Taxonomy Validation**: Hierarchical classification system based on empirical research

#### 2. **Practical Implementation**
- **Automated Detection**: Reduces manual effort in identifying contract violations
- **Educational Value**: Helps developers understand ML API contracts and best practices
- **Preventive Measures**: Catches violations before they cause runtime errors
- **Code Quality**: Improves overall ML code quality and reliability

#### 3. **Tool Integration**
- **IDE Integration**: Seamless integration with VS Code development environment
- **Workflow Support**: Supports common development workflows and practices
- **Extensibility**: Modular architecture allows for easy extension and customization
- **Performance**: Efficient processing suitable for real-time development use

### Impact and Benefits

#### 1. **Developer Productivity**
- **Early Detection**: Identifies contract violations during development
- **Automated Remediation**: Provides ready-to-use contract specifications
- **Learning Tool**: Educates developers about ML API best practices
- **Time Savings**: Reduces debugging time for ML contract-related issues

#### 2. **Code Quality Improvement**
- **Contract Compliance**: Ensures ML code follows proper API contracts
- **Error Prevention**: Prevents runtime errors caused by contract violations
- **Best Practices**: Promotes adherence to ML API usage patterns
- **Documentation**: Generates natural language documentation for contract requirements

#### 3. **Research Advancement**
- **Empirical Validation**: Provides practical validation of research findings
- **Tool Development**: Demonstrates practical application of academic research
- **Community Impact**: Contributes to the ML development community
- **Future Research**: Enables further research in ML contract verification

### Conclusion

The ML Contract Violation Detector represents a significant advancement in automated ML code analysis and contract verification. By combining cutting-edge RAG techniques with empirical research findings, the extension provides a practical solution for detecting and resolving ML API contract violations. The tool not only improves developer productivity and code quality but also serves as a bridge between academic research and practical software development, demonstrating the real-world applicability of ML contract research.

The extension's comprehensive taxonomy implementation, advanced RAG pipeline, and user-friendly interface make it a valuable tool for ML developers, researchers, and educators. Its modular architecture and extensible design ensure it can evolve with the rapidly changing ML landscape while maintaining its core mission of improving ML code quality and reliability.
