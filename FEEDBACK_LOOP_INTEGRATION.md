# Automated Feedback Loop Integration

## Overview

The automated feedback loop from the VS Code extension has been integrated into the original RAG script (`gpt_ragtest.js`). This ensures that generated PyContracts are tested and improved before being saved to files.

## What Changed

### 1. New File: `feedbackService.js`
- ES module version of the feedback service
- Handles Python code execution in the persistent venv
- Implements iterative improvement loop
- Uses the same venv path as the extension (`ml_contract_persistent_venv_v2`)

### 2. Modified: `gpt_ragtest.js`
- Added import for `FeedbackService`
- Integrated feedback loop into `classifyAndGenerate()` function
- After generating initial buggy/fixed code, the feedback loop:
  1. Tests buggy code (should show violation)
  2. Tests fixed code (should run successfully)
  3. Gets LLM feedback on execution results
  4. Improves code if needed (up to 2 iterations)
  5. Uses improved code if successful

## How It Works

```
1. RAG generates initial buggy + fixed code
   ↓
2. Feedback loop tests both codes
   ↓
3. LLM analyzes execution results
   ↓
4. LLM generates improved code (if needed)
   ↓
5. Re-test improved code
   ↓
6. Use improved code if successful, else use original
   ↓
7. Save final code to files
```

## Requirements

1. **Virtual Environment**: The script expects the venv at:
   - Windows: `%TEMP%\ml_contract_persistent_venv_v2\Scripts\python.exe`
   - Linux/Mac: `$TMPDIR/ml_contract_persistent_venv_v2/bin/python`

2. **Dependencies**: Same as the extension:
   - TensorFlow 2.10.0
   - Keras 2.10.0
   - NumPy 1.21.6
   - PyContracts 1.8.12
   - pyparsing 2.4.7

## Usage

Run the script as before:
```bash
node gpt_ragtest.js
```

The feedback loop runs automatically for each row that has both buggy and fixed code generated.

## Output

- Console logs show feedback loop progress:
  - `Running automated feedback loop for [URL]...`
  - `✅ Feedback loop successful! Using improved code (X iteration(s))`
  - `⚠️ Feedback loop completed but not fully successful, using original code`
  - `⚠️ Feedback loop failed, using original generated code: [error]`

- Final code files are saved with improved code if the feedback loop succeeded

## Customization

To use a different venv path:
```javascript
const feedbackService = new FeedbackService('/path/to/venv/bin/python');
```

To change max iterations:
```javascript
const feedbackResult = await feedbackService.runIterativeImprovement(
  originalCode,
  buggyCode,
  fixedCode,
  violationLabels,
  getLLMFeedback,
  3 // max iterations (default: 2)
);
```

## Notes

- The feedback loop only runs if both buggy and fixed code are successfully generated
- If the feedback loop fails, the original generated code is used (no data loss)
- The venv path is auto-detected but can be customized
- All execution happens in isolated temp directories





