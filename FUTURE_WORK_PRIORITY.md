# Top Priority Future Work

## 1. Real-Time Linting with Inline Suggestions ⚡

### What It Does
Detect contract violations **as you type** and show them directly in the editor with quick-fix suggestions, similar to how TypeScript or ESLint work in VS Code.

### Why It's Critical
- **Current**: Users must manually click "Detect Violations" button
- **Future**: Violations appear instantly with red squiggles and hover tooltips
- **Impact**: Transforms extension from manual tool to integrated development experience

### Implementation Approach
1. **Language Server Protocol (LSP)**: Implement Python LSP server that analyzes code in real-time
2. **Diagnostic Provider**: Use VS Code's `DiagnosticCollection` API to show violations
3. **Code Actions**: Provide quick-fix suggestions (e.g., "Add @contract decorator", "Fix data type")
4. **Incremental Analysis**: Only re-analyze changed code sections for performance

### Technical Details
- Use VS Code's `vscode.languages.registerCodeActionsProvider` API
- Integrate with existing RAG service for fast violation detection
- Cache analysis results per file to avoid redundant LLM calls
- Show violations in Problems panel with severity levels (Error/Warning/Info)

### Example User Experience
```python
# User types this:
model.fit(X_train, y_train)  # Red squiggly line appears
# Hover shows: "Contract violation: X_train should be array(float32), got array(float64)"
# Quick fix: "Convert to float32" or "Add @contract decorator"
```

---

## 2. PyTorch Support with Expanded Dataset 🔥

### What It Does
Extend the extension to support PyTorch (in addition to Keras/TensorFlow) by adding PyTorch-specific examples to the RAG dataset and generating PyContracts for PyTorch code patterns.

### Why It's Critical
- **Current**: Only 79 Keras examples, limited to TensorFlow ecosystem
- **Future**: 200+ examples covering Keras, PyTorch, and Scikit-learn
- **Impact**: Doubles potential user base (PyTorch is equally popular as TensorFlow)

### Implementation Approach
1. **Dataset Expansion**: 
   - Collect 100+ PyTorch Stack Overflow examples
   - Generate embeddings for PyTorch patterns
   - Add PyTorch-specific contract patterns (e.g., `torch.Tensor`, `nn.Module`)

2. **Pattern Detection**:
   - Detect `torch`, `torch.nn`, `torch.optim` imports
   - Identify common PyTorch violations (tensor shapes, device mismatches, gradient tracking)

3. **Contract Generation**:
   - Generate PyContracts for PyTorch tensors: `array(float32)` for `torch.Tensor`
   - Handle device contracts: `tensor(cuda)` vs `tensor(cpu)`
   - Validate model forward pass contracts

### Technical Details
- Extend `detectRequiredLibraries()` in `extension.js` to detect PyTorch
- Add PyTorch examples to `kerasembedded_examples.json` (rename to `ml_examples.json`)
- Update RAG prompt in `ragService.js` with PyTorch-specific instructions
- Add PyTorch version to `getLibraryVersions()`: `torch==1.13.1`

### Example Use Cases
```python
# PyTorch code with contract violation:
import torch
import torch.nn as nn

model = nn.Sequential(nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))
x = torch.randn(32, 784)  # Contract: should be (batch, features)
output = model(x.float())  # Violation: shape mismatch or type issue
```

---

## 3. Multi-Model LLM Support 🤖

### What It Does
Add support for multiple LLM providers (Claude, Gemini, Ollama) with automatic fallback, task-specific model selection, and cost optimization.

### Why It's Critical
- **Current**: Only OpenAI GPT-4o - single point of failure, expensive, no privacy option
- **Future**: Multiple providers with fallback, 50-70% cost reduction, local option (Ollama)
- **Impact**: Better reliability, lower costs, privacy options, user choice

### Implementation Approach
1. **Abstract LLM Interface**: Create unified `LLMProvider` base class
2. **Provider Implementations**: Add Claude, Gemini, and Ollama providers
3. **Smart Fallback**: Automatic failover if primary provider fails
4. **Task-Specific Selection**: Use cheaper models for classification, powerful models for generation
5. **Configuration UI**: Let users choose provider in VS Code settings

### Technical Details
- Abstract current OpenAI code to `OpenAIProvider` class
- Implement `ClaudeProvider`, `GeminiProvider`, `OllamaProvider`
- Add `ModelManager` with fallback logic
- Add VS Code configuration for API keys and model selection
- Add cost tracking and provider health monitoring

### Benefits
- **Cost**: 50-70% cheaper using Claude Sonnet for classification
- **Reliability**: 99.9% uptime with automatic fallback
- **Privacy**: 100% local processing option with Ollama
- **Performance**: Faster classification with optimized models
- **Flexibility**: Users choose based on cost/quality/privacy needs

### Example Configuration
```json
{
    "mlContract.llm.provider": "auto",  // Auto with fallback
    "mlContract.llm.openai.model": "gpt-4o",
    "mlContract.llm.claude.model": "claude-3-5-sonnet-20241022",
    "mlContract.llm.ollama.enabled": true  // Local fallback
}
```

See [MULTI_MODEL_SUPPORT.md](./MULTI_MODEL_SUPPORT.md) for full implementation plan.

---

## Why These Three?

1. **Real-Time Linting**: Makes the extension **proactive** - instant feedback
2. **PyTorch Support**: **Doubles the market** - PyTorch users are huge segment
3. **Multi-Model Support**: **Critical infrastructure** - reliability, cost, privacy

All three are:
- ✅ **High impact** on user experience
- ✅ **Technically feasible** with current architecture
- ✅ **Clear value proposition** for users
- ✅ **Differentiators** from other tools

---

## Implementation Priority

**Phase 1 (Month 1-2)**: Multi-Model Support + Real-Time Linting
- **Multi-Model**: Critical infrastructure improvement (reliability, cost)
- **Real-Time Linting**: Biggest UX improvement
- Both can be done in parallel

**Phase 2 (Month 3-4)**: PyTorch Support
- Requires dataset collection and embedding generation
- Expands market reach
- Builds on Phase 1 improvements

