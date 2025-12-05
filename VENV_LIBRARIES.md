# Virtual Environment Library Installation

## Overview

The extension uses a **persistent virtual environment** that pre-installs all common ML libraries when first created. This ensures all libraries are available regardless of which code runs first.

## Pre-Installed Libraries

When the venv is first created, the following libraries are **automatically pre-installed**:

| Library | Version | Purpose |
|---------|---------|---------|
| **TensorFlow** | 2.10.0 | Deep learning framework |
| **Keras** | 2.10.0 | High-level neural network API (depends on TensorFlow) |
| **PyTorch** | 1.13.1 | Deep learning framework |
| **Scikit-learn** | 1.1.3 | Machine learning library |
| **NumPy** | 1.21.6 | Numerical computing (required by all ML libraries) |
| **PyContracts** | 1.8.12 | Contract checking library |

### Auto-Included Dependencies

These are automatically added when needed:

| Library | Version | When Added |
|---------|---------|------------|
| **pyparsing** | 2.4.7 | When PyContracts is installed |
| **pandas** | 1.5.3 | When detected in code |
| **matplotlib** | 3.6.3 | When detected in code |
| **seaborn** | 0.12.2 | When detected in code |

## Installation Flow

```
1. First code execution detected
   ↓
2. Create persistent venv (if doesn't exist)
   ↓
3. Pre-install common ML libraries:
   - tensorflow==2.10.0
   - keras==2.10.0
   - torch==1.13.1
   - scikit-learn==1.1.3
   - numpy==1.21.6
   - PyContracts==1.8.12
   ↓
4. Track installed libraries in memory
   ↓
5. Run code (all libraries available)
   ↓
6. Install additional libraries on-demand if needed
```

## Benefits

✅ **Reliability**: All common ML libraries available from the start  
✅ **Speed**: No waiting for library installation during code execution  
✅ **Consistency**: Same versions across all executions  
✅ **Feedback Loop**: Can test buggy/fixed code immediately without installation delays

## Library Detection

The extension automatically detects which libraries are needed from code imports:

```python
# Detected libraries:
import tensorflow as tf      → tensorflow
import keras                 → keras (+ tensorflow)
import torch                 → torch
from sklearn import ...      → scikit-learn
import numpy as np           → numpy
from contracts import ...    → PyContracts
```

## Version Compatibility Matrix

| Library | Compatible With | Notes |
|---------|----------------|-------|
| TensorFlow 2.10.0 | NumPy 1.21.6, Keras 2.10.0 | Requires keras>=2.10.0,<2.11 |
| Keras 2.10.0 | TensorFlow 2.10.0 | Depends on TensorFlow |
| PyTorch 1.13.1 | NumPy 1.21.6 | Compatible with NumPy 1.21.x |
| Scikit-learn 1.1.3 | NumPy 1.21.6 | Compatible with NumPy 1.21.x |
| NumPy 1.21.6 | All ML libraries | Base dependency |
| PyContracts 1.8.12 | NumPy 1.21.6 | Requires pyparsing 2.4.7 |

## Venv Location

- **Windows**: `%TEMP%\ml_contract_persistent_venv_v2\`
- **Linux/Mac**: `$TMPDIR/ml_contract_persistent_venv_v2/`

## Manual Library Installation

If you need additional libraries not in the pre-installed set, they will be installed automatically when detected in your code. However, you can also manually install them:

```bash
# Activate venv
# Windows:
%TEMP%\ml_contract_persistent_venv_v2\Scripts\activate

# Linux/Mac:
source $TMPDIR/ml_contract_persistent_venv_v2/bin/activate

# Install additional library
pip install library-name==version
```

## Troubleshooting

### Venv Not Found
If the venv is missing, it will be automatically recreated and all libraries will be pre-installed again.

### Library Installation Fails
If a library fails to install:
- Check your internet connection
- Verify the library version is available on PyPI
- Check Python version compatibility (3.10-3.11)

### Version Conflicts
All versions are carefully selected for compatibility. If you encounter conflicts:
- Check the compatibility matrix above
- Ensure you're using Python 3.10 or 3.11
- Report the issue with the specific error message

## Future Improvements

- [ ] Add support for more ML libraries (JAX, Hugging Face, etc.)
- [ ] Allow users to customize pre-installed libraries
- [ ] Cache library installations for faster setup
- [ ] Support multiple venv profiles (TF 1.x, TF 2.x, etc.)

