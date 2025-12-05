# Versioning Strategy for ML Contract Extension

## Overview

The extension uses a **hybrid approach** for handling library version compatibility:

1. **Primary Strategy**: LLM generates code with compatible API versions
2. **Secondary Strategy**: Automatic code transformation during execution (safety net)

## Why Hybrid Approach?

### Benefits:
- ✅ **Reliability**: LLM generates correct code, transformer catches edge cases
- ✅ **Maintainability**: Centralized compatibility rules in transformer
- ✅ **Performance**: LLM doesn't need to handle every edge case
- ✅ **Flexibility**: Can update compatibility rules without retraining LLM

### Trade-offs:
- ⚠️ **Complexity**: Two systems to maintain
- ⚠️ **Debugging**: Need to track which system made which change

## Implementation Details

### 1. LLM Generation (Primary)

**Location**: `src/rag/ragService.js` - `buildPyPrompt()`

**Instructions to LLM**:
```
0) Replicate the question's code verbatim when possible. Only replace APIs that are 
   deprecated/removed or incompatible with the TARGET ENVIRONMENT. For each such change, 
   add an inline comment:
   # [REPLACED] <old> -> <new> (reason)
```

**Target Environment**:
- Python: 3.10–3.11
- TensorFlow: 2.10.0
- Keras: 2.10.0
- NumPy: 1.21.6
- PyContracts: 1.8.12

**What LLM Should Do**:
- Generate code using compatible APIs (TF 2.x style)
- Add `# [REPLACED]` comments when making compatibility changes
- Focus on contract logic, not every API detail

### 2. Code Transformer (Secondary/Safety Net)

**Location**: `src/utils/codeTransformer.js`

**What It Does**:
- Automatically transforms deprecated APIs to compatible versions
- Adds `tf.compat.v1.disable_eager_execution()` when needed
- Fixes NumPy compatibility issues (np.int → np.int32)
- Handles common TensorFlow 1.x → 2.x migrations

**When It Runs**:
- During code execution in `FeedbackService.executePythonCode()`
- Before writing code to temp file
- Logs all transformations for debugging

**Transformation Rules**:
```javascript
// Example transformations:
tf.Session() → tf.compat.v1.Session()
tf.placeholder() → tf.compat.v1.placeholder()
tf.initialize_all_variables() → tf.compat.v1.global_variables_initializer()
np.int() → np.int32()
from keras import → from tensorflow.keras import
```

### 3. Virtual Environment (Execution)

**Location**: `src/extension.js` - `getLibraryVersions()`

**What It Does**:
- Installs specific library versions in persistent venv
- Ensures all dependencies are compatible
- Auto-includes required dependencies (e.g., pyparsing for PyContracts)

**Version Map**:
```javascript
{
    'tensorflow': '2.10.0',
    'keras': '2.10.0',
    'numpy': '1.21.6',
    'PyContracts': '1.8.12',
    'pyparsing': '2.4.7',
    // ... more
}
```

## Execution Flow

```
1. User code detected
   ↓
2. LLM generates code with compatible APIs
   ↓
3. Code transformer checks and fixes edge cases
   ↓
4. Code written to temp file with compatibility fixes
   ↓
5. Wrapper script adds collections.abc fix
   ↓
6. Execute in venv with specific versions
   ↓
7. Return results
```

## Decision Matrix

| Scenario | LLM Action | Transformer Action |
|----------|-----------|-------------------|
| Modern TF 2.x code | Generate as-is | No transformation needed |
| Old TF 1.x code | Generate with `tf.compat.v1.*` | Verify and fix if missed |
| NumPy deprecated | Generate with `np.int32()` | Fix `np.int()` if present |
| Missing eager disable | Generate with `disable_eager_execution()` | Add if missing for graph mode |
| Collections.abc | Generate normally | Add compatibility fix in wrapper |

## Best Practices

### For LLM Prompts:
- ✅ Specify target environment clearly
- ✅ Ask for `[REPLACED]` comments when making changes
- ✅ Focus on contract logic, not every API detail
- ✅ Trust transformer for common patterns

### For Code Transformer:
- ✅ Only transform well-known patterns
- ✅ Log all transformations
- ✅ Don't transform code that already has `[REPLACED]` comments (LLM handled it)
- ✅ Be conservative - only fix clear compatibility issues

### For Version Management:
- ✅ Pin all versions explicitly
- ✅ Document compatibility matrix
- ✅ Test version combinations
- ✅ Update versions carefully (test thoroughly)

## Future Improvements

1. **Smart Transformation**:
   - Detect if LLM already handled compatibility
   - Skip transformation if `[REPLACED]` comments present
   - Only transform code that clearly needs it

2. **Version Detection**:
   - Detect which TF version code was written for
   - Apply appropriate transformations based on detected version
   - Support multiple TF versions (1.x, 2.x)

3. **Transformation Rules Database**:
   - External configuration file for transformation rules
   - Easy to update without code changes
   - Support for custom transformations

4. **LLM Feedback Loop**:
   - If transformer fixes code, inform LLM
   - LLM learns to generate better code
   - Reduce need for transformations over time

## Example

**Input Code (TF 1.x style)**:
```python
import tensorflow as tf

sess = tf.Session()
x = tf.placeholder(tf.float32, [None, 784])
```

**LLM Output (should be)**:
```python
import tensorflow as tf
tf.compat.v1.disable_eager_execution()  # [REPLACED] Added for graph mode

sess = tf.compat.v1.Session()  # [REPLACED] tf.Session() -> tf.compat.v1.Session()
x = tf.compat.v1.placeholder(tf.float32, [None, 784])  # [REPLACED] tf.placeholder() -> tf.compat.v1.placeholder()
```

**If LLM Misses Something, Transformer Fixes**:
```python
# Transformer detects tf.Session() and fixes it
# Logs: [AUTO-REPLACED] tf.Session() -> tf.compat.v1.Session()
```

## Conclusion

The hybrid approach provides the best of both worlds:
- **LLM handles the logic** (contracts, buggy/fixed code)
- **Transformer handles compatibility** (API versions, edge cases)
- **Venv ensures execution** (correct library versions)

This separation of concerns makes the system more maintainable and reliable.

