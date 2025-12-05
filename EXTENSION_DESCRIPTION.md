# ML Contract Violation Detector - VS Code Extension
## RAG-Based ML API Contract Detection and Generation Tool

### Executive Summary

**ML Contract Violation Detector (MLSpecGen)** is a sophisticated VS Code extension that automatically detects Machine Learning API contract violations in Python code and generates executable PyContract specifications. Built on Retrieval-Augmented Generation (RAG) technology, it combines a curated dataset of 79 Keras-specific violation examples with GPT-4o to provide intelligent, context-aware contract violation detection and automated remediation.

---

## Core Functionality

### 1. **Automated ML Code Analysis**
- **Real-time Code Scanning**: Continuously monitors Python files for ML library usage patterns
- **Multi-library Support**: Detects violations across TensorFlow, Keras, PyTorch, and Scikit-learn
- **Pattern Recognition**: Identifies potential contract violations through static analysis
- **Code Snippet Extraction**: Automatically extracts relevant ML operation sections for detailed analysis

### 2. **RAG-Powered Violation Detection**
- **Embedding-based Similarity Search**: Uses vector embeddings (Ollama nomic-embed-text with OpenAI fallback) to find similar violation patterns from pre-processed dataset
- **Context Retrieval**: Leverages embedded research context and 79 curated Keras examples for accurate classification
- **Multi-level Taxonomy Classification**: Implements hierarchical classification system:
  - **Level 1**: Central Contract Categories (SAM, AMO, Hybrid)
  - **Level 2**: Contract Subcategories (DT, BET, G, F, SAI, Selection)
  - **Level 3**: Hybrid Patterns (PT, BIT, RT, MT, IC-1, IC-2)

### 3. **AI-Powered Contract Generation**
- **Executable PyContract Specifications**: Generates ready-to-use `@contract` decorators using PyContracts library
- **Dual Code Generation**: Creates both buggy (violating) and fixed (compliant) code versions
- **Natural Language Explanations**: Provides clear descriptions of contract preconditions/postconditions
- **Actionable Insights**: Offers specific remediation steps for developers

### 4. **Automated Testing & Feedback Loop**
- **Persistent Virtual Environment**: Manages isolated Python environment with compatible library versions (TensorFlow 2.10.0, Keras 2.10.0, NumPy 1.21.6, PyContracts 1.8.12)
- **Automatic Library Detection**: Detects and installs required ML libraries in venv
- **Code Execution**: Runs both buggy and fixed code examples to verify contract violations
- **LLM Feedback Loop**: Iteratively improves generated contracts based on execution results (up to 2 iterations)

---

## Technical Architecture

### **Technology Stack**
- **VS Code Extension API**: Native extension framework
- **Node.js/JavaScript**: Core extension logic and webview management
- **RAG (Retrieval-Augmented Generation)**: Semantic search using embeddings
- **OpenAI GPT-4o**: Large Language Model for classification and generation
- **Ollama (nomic-embed-text)**: Local embedding generation with OpenAI fallback
- **PyContracts**: Python library for runtime contract checking
- **Python Virtual Environment**: Isolated execution environment

### **Project Structure**
```
ml-contract-extension/
├── src/
│   ├── extension.js              # Main extension entry point
│   ├── rag/
│   │   ├── ragService.js         # RAG pipeline and GPT integration
│   │   └── embeddedData.js       # Curated dataset (79 examples) and research context
│   ├── utils/
│   │   └── codeAnalyzer.js       # Python code analysis engine
│   ├── services/
│   │   └── feedbackService.js    # LLM feedback loop for contract improvement
│   └── webview/
│       ├── dashboardProvider.js  # Interactive dashboard provider
│       ├── dashboard.js          # Frontend JavaScript
│       └── dashboard.css         # Modern UI styling
├── resources/
│   ├── research_context.txt      # Taxonomy definitions and research paper context
│   ├── actionable_examples.txt   # Insight examples
│   ├── pycontracts_doc.txt       # PyContracts documentation
│   ├── pycontracts_deep.txt      # Advanced ML patterns
│   └── kerasembedded_examples.json # Embedded examples dataset (79 examples)
└── package.json
```

### **RAG Pipeline Workflow**
```
1. Code Analysis → Extract ML patterns and APIs from user's code
2. Embedding Generation → Create vector representation (Ollama/OpenAI)
3. Similarity Search → Find top 5 similar examples from pre-embedded dataset
4. Context Assembly → Combine research context + similar examples + PyContracts docs
5. LLM Classification → Generate violation labels using GPT-4o
6. Contract Generation → Create executable PyContract specifications
7. Feedback Loop → Test execution and iteratively improve contracts
```

---

## Key Features

### **Interactive Dashboard**
- **Modern Web-based UI**: Clean, responsive interface with real-time analysis
- **Multi-modal Input**: Support for both file-based and direct code paste analysis
- **Detailed Violation Display**: Comprehensive violation information with taxonomy labels
- **Code Comparison**: Side-by-side display of buggy vs. fixed code
- **One-click Application**: Apply generated contracts directly to code files

### **VS Code Integration**
- **Command Palette**: Quick access via `ML Contract: Open Dashboard`
- **Context Menus**: Right-click on Python files to analyze
- **Progress Indicators**: Real-time feedback during analysis
- **Terminal Integration**: Automatic code execution in persistent venv

### **Advanced Capabilities**
- **Collections Compatibility Fix**: Automatic Python 3.10+ compatibility for PyContracts
- **TensorFlow Version Compatibility**: Handles TF 1.x and 2.x API differences
- **Minimal Code Changes**: Preserves original code structure while adding contracts
- **Deterministic Execution**: Uses synthetic data and random seeds for reproducibility

---

## Research Foundation

### **Academic Basis**
Built upon empirical research analyzing 413 ML API specifications from Stack Overflow posts, establishing a comprehensive taxonomy for ML contract violations:

- **Central Contract Categories**: Single API Method (SAM), API Method Order (AMO), and Hybrid violations
- **Violation Patterns**: Data type mismatches, method order violations, inter-argument contract issues
- **Impact Analysis**: Classification of effects (Crash, Incorrect Functionality, Bad Performance, Model Output Bias)

### **Taxonomy Implementation**

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

---

## Usage Workflow

### **Step 1: Open Dashboard**
- Use Command Palette: `ML Contract: Open Dashboard`
- Or right-click on Python file → `ML Contract: Open Dashboard`

### **Step 2: Detect Violations**
- Click "🔍 Detect Contract Violations" button
- Extension analyzes code for ML API patterns
- RAG service retrieves similar examples and classifies violations
- Results displayed with multi-level taxonomy labels

### **Step 3: Generate Contracts**
- Click "⚡ Generate PyContracts" button
- GPT-4o generates executable contract specifications
- Creates both buggy and fixed code versions
- Provides natural language explanations and actionable insights

### **Step 4: Apply Contracts**
- Review generated contracts in dashboard
- Click "Apply Contract" to insert into code
- Extension automatically applies compatibility fixes

### **Step 5: Test Execution (Optional)**
- Click "Run Buggy Code" or "Run Fixed Code" in dashboard
- Extension creates persistent venv, installs libraries, and executes code
- Verifies that buggy code fails with contract violations
- Verifies that fixed code passes validation

---

## Example Output

### **Input Code**
```python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(10, activation='relu'),
    tf.keras.layers.Dense(1)
])

# Potential violation: missing fit() before predict()
predictions = model.predict(X_test)
```

### **Generated Contract (Buggy Version)**
```python
from contracts import contract
import tensorflow as tf

@contract(model='trained_model', X='array(float32)')
def safe_predict(model, X):
    """Predict with contract validation"""
    return model.predict(X)

# Custom contract for trained model
@new_contract
def trained_model(model):
    return hasattr(model, 'history') and model.history is not None

# This will fail - model not trained
predictions = safe_predict(model, X_test)
```

### **Generated Contract (Fixed Version)**
```python
from contracts import contract
import tensorflow as tf

@contract(model='trained_model', X='array(float32)')
def safe_predict(model, X):
    """Predict with contract validation"""
    return model.predict(X)

# Custom contract for trained model
@new_contract
def trained_model(model):
    return hasattr(model, 'history') and model.history is not None

# Fixed: Train model first
model.compile(optimizer='adam', loss='mse')
model.fit(X_train, y_train, epochs=10)

# Now prediction will pass contract validation
predictions = safe_predict(model, X_test)
```

---

## Configuration

### **Environment Variables**
Create a `.env` file:
```env
OPENAI_API_KEY=your-openai-api-key-here
OUTPUT_DIR=ml-contract-outputs
```

### **Ollama Setup (Optional)**
For local embeddings:
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the embedding model
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

### **Persistent Virtual Environment**
Extension automatically manages a persistent Python virtual environment at:
- **Windows**: `%TEMP%\ml_contract_persistent_venv_v2`
- **Linux/Mac**: `/tmp/ml_contract_persistent_venv_v2`

Libraries are automatically installed with compatible versions:
- TensorFlow 2.10.0
- Keras 2.10.0
- NumPy 1.21.6
- PyContracts 1.8.12
- PyParsing 2.4.7

---

## Impact and Benefits

### **Developer Productivity**
- **Early Detection**: Identifies contract violations during development
- **Automated Remediation**: Provides ready-to-use contract specifications
- **Learning Tool**: Educates developers about ML API best practices
- **Time Savings**: Reduces debugging time for ML contract-related issues

### **Code Quality Improvement**
- **Contract Compliance**: Ensures ML code follows proper API contracts
- **Error Prevention**: Prevents runtime errors caused by contract violations
- **Best Practices**: Promotes adherence to ML API usage patterns
- **Documentation**: Generates natural language documentation for contract requirements

### **Research Advancement**
- **Empirical Validation**: Provides practical validation of research findings
- **Tool Development**: Demonstrates practical application of academic research
- **Community Impact**: Contributes to the ML development community
- **Future Research**: Enables further research in ML contract verification

---

## Supported ML Libraries

- **TensorFlow**: Model construction, training, evaluation, variable initialization
- **Keras**: Layer configuration, model compilation, training, prediction
- **PyTorch**: Module definition, training loops, tensor operations
- **Scikit-learn**: Model fitting, prediction, preprocessing

---

## Future Enhancements

### **Enhanced ML Library Support**
- Additional frameworks (JAX, Hugging Face Transformers, XGBoost, LightGBM)
- Version-specific contracts (TensorFlow 1.x vs 2.x)
- Custom library support

### **Expanded Dataset & RAG Improvements**
- Larger dataset (500+ examples across multiple ML frameworks)
- Multi-framework examples (PyTorch, Scikit-learn)
- Dynamic dataset updates
- Better embeddings (fine-tuned for ML code patterns)

### **Advanced Contract Features**
- Custom contract definitions
- Contract templates for common ML patterns
- Contract composition (complex, multi-level combinations)
- Performance and resource contracts

### **Real-Time Analysis & Linting**
- Live linting (real-time contract violation detection)
- Inline suggestions with quick fixes
- IntelliSense integration
- Diagnostic panel

---

## Installation

1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd VSExtension
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment**
   ```bash
   cp env.example .env
   # Edit .env with your OpenAI API key
   ```

4. **Build Extension**
   ```bash
   npm run esbuild
   ```

5. **Run in VS Code**
   - Press `F5` to run in Extension Development Host
   - Or package: `vsce package`

---

## License

MIT License

---

## Acknowledgments

- Based on research: "Characterizing Machine Learning Contracts Using Large Language Models"
- Uses PyContracts library for contract specifications
- Integrates OpenAI GPT-4o for AI-powered analysis
- Built with VS Code Extension API
- Curated dataset of 79 Keras-specific violation examples

---

## Contact & Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check README.md for detailed guides
- **Community**: Join discussions in GitHub Discussions

---

**Version**: 0.1.0  
**Last Updated**: 2024  
**Status**: Active Development


