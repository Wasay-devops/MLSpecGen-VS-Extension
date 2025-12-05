# ML Contract Violation Detector - Summary

## Overview
A VS Code extension that automatically detects Machine Learning API contract violations in Python code and generates executable PyContract specifications using RAG (Retrieval-Augmented Generation) and GPT-4o.

## Key Features
- **Automated Detection**: Scans Python code for ML API violations (TensorFlow, Keras, PyTorch, Scikit-learn)
- **RAG-Powered**: Uses 79 curated Keras examples with semantic search for accurate classification
- **Contract Generation**: Creates executable `@contract` decorators for both buggy and fixed code versions
- **Multi-level Taxonomy**: Hierarchical classification (SAM/AMO/Hybrid → DT/BET/G/F → PT/BIT/RT/MT/IC-1/IC-2)
- **Automated Testing**: Persistent virtual environment with automatic library installation and code execution
- **LLM Feedback Loop**: Iteratively improves generated contracts based on execution results

## Technology Stack
- VS Code Extension API (Node.js/JavaScript)
- RAG: Ollama (nomic-embed-text) with OpenAI fallback for embeddings
- LLM: OpenAI GPT-4o for classification and generation
- PyContracts: Python library for runtime contract checking
- Persistent Python venv: TensorFlow 2.10.0, Keras 2.10.0, NumPy 1.21.6, PyContracts 1.8.12

## How It Works
1. Analyzes Python code for ML library usage patterns
2. Creates embeddings and finds similar violation examples from curated dataset
3. Uses GPT-4o to classify violations using hierarchical taxonomy
4. Generates executable PyContract specifications with buggy and fixed code
5. Tests execution in isolated virtual environment with automatic feedback loop

## Research Foundation
Built on empirical research analyzing 413 ML API specifications from Stack Overflow, establishing a comprehensive taxonomy for ML contract violations including:
- Central Contract Categories (SAM, AMO, Hybrid)
- Contract Subcategories (DT, BET, G, F, SAI, Selection)
- Hybrid Patterns (PT, BIT, RT, MT, IC-1, IC-2)

## Benefits
- **Early Detection**: Identifies violations during development
- **Automated Remediation**: Ready-to-use contract specifications
- **Educational**: Teaches ML API best practices
- **Time Savings**: Reduces debugging time for contract-related issues
- **Code Quality**: Ensures ML code follows proper API contracts

## Usage
1. Open dashboard via Command Palette or right-click menu
2. Click "Detect Contract Violations" to analyze code
3. Click "Generate PyContracts" to create executable specifications
4. Review and apply contracts directly to code
5. Optionally test execution in persistent virtual environment

## Output
Generates two code versions:
- **Buggy**: Reproduces the failure with contract violation
- **Fixed**: Satisfies the contract and exits successfully

Both include natural language explanations and actionable insights for developers.


