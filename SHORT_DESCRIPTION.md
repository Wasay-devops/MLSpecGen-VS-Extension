# ML Contract Violation Detector - MLSpecGen

## Short Description

A VS Code extension that automatically detects Machine Learning API contract violations in Python code and generates executable PyContract specifications. Uses RAG (Retrieval-Augmented Generation) with 79 curated Keras examples and GPT-4o to identify violations, then creates `@contract` decorators for both buggy and fixed code versions with minimal code changes.

## Key Features

- 🔍 **Contract Violation Detection**: Identifies ML API misuse patterns (TensorFlow, Keras, PyTorch, Scikit-learn)
- ⚡ **PyContract Generation**: Creates executable contract decorators for buggy and fixed code
- 🤖 **RAG-Powered**: Uses semantic search with 79 Keras examples for accurate context retrieval
- ✅ **Automated Testing**: Feedback loop verifies buggy code fails and fixed code passes
- 🐍 **Persistent Virtual Environment**: Manages compatible library versions (TensorFlow 2.10.0, Keras 2.10.0, NumPy 1.21.6, PyContracts 1.8.12)

## Technology Stack

- **VS Code Extension API** - Native extension framework
- **Node.js/JavaScript** - Extension logic and webview
- **RAG** - Retrieval-Augmented Generation with embeddings
- **OpenAI GPT-4o** - LLM for classification and generation
- **PyContracts** - Python contract checking library
- **Python venv** - Isolated execution environment

## One-Liner

VS Code extension that detects ML API contract violations using RAG + GPT-4o and generates executable PyContracts with automated testing in a persistent virtual environment.












