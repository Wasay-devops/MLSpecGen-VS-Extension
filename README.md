# ML Contract Violation Detector - MLSpecGen

A VS Code extension that detects ML API contract violations and generates executable PyContracts using RAG (Retrieval-Augmented Generation) and GPT-4o.

## Overview

**ML Contract Violation Detector - MLSpecGen** is a VS Code extension that automatically detects and fixes Machine Learning API contract violations in Python code. It uses Retrieval-Augmented Generation (RAG) with a curated dataset of 79 Keras-specific examples to identify common ML API misuse patterns, then generates executable PyContract specifications that validate function parameters and return values.

### What It Does

- **Detects Contract Violations**: Analyzes Python code for ML library usage (TensorFlow, Keras, PyTorch, Scikit-learn) and identifies potential API misuse patterns using a hierarchical taxonomy (SAM/AMO/Hybrid classifications)
- **Generates PyContracts**: Creates executable `@contract` decorators for both buggy and fixed code versions, ensuring minimal code changes while adding contract validation
- **Automated Testing**: Runs an automated feedback loop to verify that buggy code fails with contract violations and fixed code passes validation
- **Persistent Environment**: Manages a persistent Python virtual environment with compatible library versions (TensorFlow 2.10.0, Keras 2.10.0, NumPy 1.21.6, PyContracts 1.8.12)

### Built With

- **VS Code Extension API**: Native VS Code extension framework
- **Node.js/JavaScript**: Core extension logic and webview management
- **RAG (Retrieval-Augmented Generation)**: Semantic search using embeddings to retrieve relevant examples from a curated dataset
- **OpenAI GPT-4o**: Large Language Model for contract violation classification and PyContract generation
- **PyContracts**: Python library for runtime contract checking with `@contract` decorators
- **Python Virtual Environment**: Isolated environment for executing generated code with compatible ML library versions
- **Embeddings**: Vector-based similarity search for RAG context retrieval

## Features

- 🔍 **Live Code Analysis**: Analyzes Python files for ML API patterns in real-time
- 🚨 **Contract Violation Detection**: Identifies potential ML API misuse patterns
- 📊 **Multi-level Classification**: Uses hierarchical taxonomy to classify violations
- ⚡ **PyContract Generation**: Generates executable contract specifications
- 🎯 **Interactive Dashboard**: Beautiful UI to view violations and apply contracts
- 🔧 **One-click Application**: Apply generated contracts directly to your code

## How It Works

1. **Code Analysis**: Scans your Python code for ML library usage (TensorFlow, Keras, PyTorch, Scikit-learn)
2. **RAG Retrieval**: Uses embeddings to find similar patterns from a curated dataset
3. **AI Classification**: GPT-4o classifies violations using a multi-level taxonomy
4. **Contract Generation**: Creates executable PyContract specifications
5. **Interactive Dashboard**: Shows results and allows contract application

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your OpenAI API key
   ```
4. Build the extension:
   ```bash
   npm run esbuild
   ```
5. Install in VS Code:
   - Press `F5` to run in Extension Development Host
   - Or package and install: `vsce package`

## Configuration

### Environment Variables

Create a `.env` file with:

```env
OPENAI_API_KEY=your-openai-api-key-here
OUTPUT_DIR=ml-contract-outputs
```

### Ollama Setup (Optional)

For local embeddings, install and run Ollama:

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull the embedding model
ollama pull nomic-embed-text

# Start Ollama server
ollama serve
```

## Usage

1. **Open a Python file** with ML code (TensorFlow, Keras, PyTorch, etc.)
2. **Open the Dashboard**: 
   - Use Command Palette: `ML Contract: Open Dashboard`
   - Or right-click in editor → `ML Contract: Open Dashboard`
3. **Detect Violations**: Click "🔍 Detect Contract Violations"
4. **Generate Contracts**: Click "⚡ Generate PyContracts"
5. **Apply Contracts**: Review and apply generated contracts to your code

## Dashboard Features

### Action Buttons
- **🔍 Detect Contract Violations**: Analyzes current file for ML API patterns
- **⚡ Generate PyContracts**: Creates executable contract specifications

### Violation Display
- **Multi-level Classification**: Shows Level 1/2/3 taxonomy labels
- **Root Cause Analysis**: Identifies why the violation occurs
- **Effect Prediction**: Shows potential impact (Crash, Incorrect Functionality, etc.)
- **Location Detection**: Pinpoints where in the ML pipeline the issue occurs

### Contract Generation
- **Executable PyContracts**: Ready-to-use `@contract` decorators
- **Natural Language Explanations**: Clear descriptions of what contracts check
- **Actionable Insights**: Specific steps to fix violations
- **One-click Application**: Apply contracts directly to your code

## Taxonomy

The extension uses a hierarchical taxonomy to classify ML contract violations:

### Level 1: Central Contract Category
- **SAM**: Single API Method violations
- **AMO**: API Method Order violations  
- **Hybrid**: Combination of SAM and AMO

### Level 2: Contract Subcategories
- **DT**: Data Type violations
- **BET**: Boolean Expression Type violations
- **G**: Always temporal contracts
- **F**: Eventually temporal contracts
- **SAI/SL**: Selection-based contracts

### Level 3: Hybrid Patterns
- **PT**: Primitive Type violations
- **BIT**: Built-in Type violations
- **RT**: Reference Type violations
- **MT**: ML Type violations
- **IC-1**: Intra-argument Contract violations
- **IC-2**: Inter-argument Contract violations

## Supported ML Libraries

- **TensorFlow**: Model construction, training, evaluation
- **Keras**: Layer configuration, model compilation
- **PyTorch**: Module definition, training loops
- **Scikit-learn**: Model fitting, prediction, preprocessing

## Example Usage

### Input Code
```python
import tensorflow as tf

# Potential violation: missing fit() before predict()
model = tf.keras.Sequential([
    tf.keras.layers.Dense(10, activation='relu'),
    tf.keras.layers.Dense(1)
])

# This will fail - model not trained
predictions = model.predict(X_test)
```

### Generated Contract
```python
from contracts import contract

@contract(model='trained_model', X='array[*,*]')
def safe_predict(model, X):
    """Predict with contract validation"""
    return model.predict(X)

# Custom contract for trained model
@new_contract
def trained_model(model):
    return hasattr(model, 'history') and model.history is not None
```

## Development

### Project Structure
```
ml-contract-extension/
├── src/
│   ├── extension.js              # Main extension entry
│   ├── rag/
│   │   └── ragService.js         # RAG pipeline and GPT integration
│   ├── utils/
│   │   └── codeAnalyzer.js       # Python code analysis
│   └── webview/
│       ├── dashboardProvider.js  # Dashboard provider
│       ├── dashboard.js          # Dashboard JavaScript
│       └── dashboard.css         # Dashboard styles
├── resources/
│   ├── research_context.txt      # Taxonomy definitions
│   ├── actionable_examples.txt   # Insight examples
│   ├── pycontracts_doc.txt       # PyContracts documentation
│   ├── pycontracts_deep.txt      # Advanced ML patterns
│   └── kerasembedded_examples.json # Embedded examples dataset
└── package.json
```

### Building
```bash
# Development build
npm run esbuild

# Watch mode
npm run esbuild-watch

# Production build
npm run vscode:prepublish
```

### Testing
```bash
# Run tests
npm test

# Lint code
npm run lint
```

## Future Work

### Enhanced ML Library Support
- **Additional Frameworks**: Support for JAX, Hugging Face Transformers, XGBoost, LightGBM
- **Version-Specific Contracts**: Handle different API versions (e.g., TensorFlow 1.x vs 2.x)
- **Custom Library Support**: Allow users to define custom ML library patterns and contracts

### Expanded Dataset & RAG Improvements
- **Larger Dataset**: Expand from 79 to 500+ examples across multiple ML frameworks
- **Multi-Framework Examples**: Include PyTorch, Scikit-learn, and other library examples
- **Dynamic Dataset Updates**: Allow users to contribute examples and update the dataset
- **Better Embeddings**: Fine-tune embeddings specifically for ML code patterns
- **Contextual RAG**: Improve context retrieval with code structure awareness

### Advanced Contract Features
- **Custom Contract Definitions**: Allow users to define domain-specific contracts
- **Contract Templates**: Pre-built contract templates for common ML patterns
- **Contract Composition**: Support for complex, multi-level contract combinations
- **Performance Contracts**: Contracts that validate computational complexity
- **Resource Contracts**: Contracts for memory usage, GPU requirements, etc.

### Real-Time Analysis & Linting
- **Live Linting**: Real-time contract violation detection as you type
- **Inline Suggestions**: Show contract violations directly in the editor with quick fixes
- **IntelliSense Integration**: Contract-aware autocomplete and suggestions
- **Diagnostic Panel**: Dedicated panel showing all contract issues across workspace

### User Experience Enhancements
- **Interactive Tutorial**: Guided walkthrough for first-time users
- **Contract Visualization**: Visual diagrams showing contract relationships
- **Code Diff View**: Side-by-side comparison of buggy vs fixed code
- **Export/Import**: Export contracts to share with team or import from templates
- **Batch Processing**: Analyze multiple files or entire projects at once
- **History & Undo**: Track contract application history with undo capability

### Testing & Quality Assurance
- **Unit Test Generation**: Auto-generate unit tests based on contracts
- **Integration with pytest**: Generate pytest test cases from contracts
- **Coverage Metrics**: Track contract coverage across codebase
- **Regression Testing**: Detect when code changes break existing contracts
- **CI/CD Integration**: GitHub Actions, GitLab CI, Jenkins plugins

### Performance & Scalability
- **Incremental Analysis**: Only re-analyze changed code sections
- **Caching**: Cache RAG results and contract generation for faster responses
- **Parallel Processing**: Analyze multiple files concurrently
- **Background Processing**: Run analysis in background without blocking UI
- **Optimized Embeddings**: Use faster embedding models or local alternatives

### Collaboration & Sharing
- **Team Workspace**: Share contracts and violations across team members
- **Contract Marketplace**: Community-contributed contract templates
- **Version Control Integration**: Track contract changes in git history
- **Code Review Integration**: Highlight contract violations in PR reviews
- **Slack/Teams Notifications**: Alert team about critical contract violations

### Advanced AI Features
- **Multi-Model Support**: Support for Claude, Gemini, and local LLMs (Ollama)
- **Fine-Tuned Models**: Train specialized models for ML contract detection
- **Few-Shot Learning**: Improve accuracy with user-provided examples
- **Explainability**: Better explanations of why violations occur and how to fix
- **Learning Mode**: Extension learns from user corrections to improve suggestions

### Developer Tools
- **Contract Debugger**: Step-through contract validation to understand failures
- **Performance Profiling**: Measure contract validation overhead
- **Contract Metrics Dashboard**: Visualize contract coverage, violations, trends
- **API Documentation**: Auto-generate API docs with contract specifications
- **Migration Tools**: Help migrate code between ML framework versions

### Accessibility & Internationalization
- **Multi-Language Support**: Support for non-English code comments and documentation
- **Accessibility**: Screen reader support, keyboard navigation improvements
- **Dark/Light Themes**: Better theme integration and customization
- **Localization**: UI translations for different languages

### Research & Academic
- **Empirical Studies**: Collect anonymized data on common ML contract violations
- **Benchmark Suite**: Standardized test suite for ML contract detection tools
- **Academic Publications**: Publish findings on ML contract patterns
- **Open Dataset**: Release curated dataset for research community

### Integration Ecosystem
- **Jupyter Notebook Support**: Detect and fix contracts in .ipynb files
- **Google Colab Extension**: Browser extension for Colab notebooks
- **PyCharm Plugin**: Port functionality to PyCharm IDE
- **VS Code Remote**: Support for remote development environments
- **Docker Integration**: Pre-configured Docker images with all dependencies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Based on research: "Characterizing Machine Learning Contracts Using Large Language Models"
- Uses PyContracts library for contract specifications
- Integrates OpenAI GPT-4o for AI-powered analysis
- Built with VS Code Extension API

## Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join discussions in GitHub Discussions
