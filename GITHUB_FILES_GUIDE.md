# Files and Folders for GitHub Repository

## ✅ **MUST INCLUDE** (Essential for Extension)

### Core Extension Files
```
src/
├── extension.js              # Main entry point
├── services/
│   └── feedbackService.js    # Feedback loop service
├── rag/
│   ├── ragService.js         # RAG service
│   └── embeddedData.js       # Embedded data
├── utils/
│   ├── codeAnalyzer.js       # Code analysis
│   └── codeTransformer.js    # Code transformation
└── webview/
    ├── dashboardProvider.js  # Dashboard provider
    ├── dashboard.js          # Dashboard frontend
    └── dashboard.css          # Dashboard styles
```

### Configuration Files
```
package.json                  # Extension manifest (REQUIRED)
package-lock.json            # Dependency lock file (RECOMMENDED)
.env.example                 # Environment variable template
```

### Resources (Data Files)
```
resources/
├── actionable_examples.txt
├── kerasembedded_examples.json
├── pycontracts_deep.txt
├── pycontracts_doc.txt
└── research_context.txt
```

### Documentation
```
README.md                     # Main README (REQUIRED for GitHub)
EXTENSION_DESCRIPTION.md     # Extension description
EXTENSION_SUMMARY.md         # Quick summary
VERSIONING_STRATEGY.md       # Versioning documentation
VENV_LIBRARIES.md           # Venv libraries documentation
FIXES_APPLIED.md            # Fixes documentation
```

## ❌ **MUST EXCLUDE** (Add to .gitignore)

### Build Output
```
out/                         # Compiled/bundled output
*.vsix                       # Extension package files
```

### Dependencies
```
node_modules/                # npm dependencies (install with npm install)
package-lock.json            # Optional: some prefer to exclude, but recommended to include
```

### Virtual Environments
```
venv/                       # Python virtual environment
.venv/                      # Alternative venv location
ml_contract_persistent_venv_v2/  # Persistent venv
```

### Temporary/Generated Files
```
*.log                       # Log files
*.pyc                       # Python bytecode
__pycache__/                # Python cache
*.tmp                       # Temporary files
.DS_Store                   # macOS system file
Thumbs.db                   # Windows system file
```

### IDE/Editor Files
```
.vscode/                    # VS Code workspace settings (optional - some include)
.idea/                      # IntelliJ/WebStorm settings
*.swp                       # Vim swap files
*.swo                       # Vim swap files
```

### Test/Development Files
```
test_*.py                   # Test files (optional - you might want to include)
*_test.js                   # Test files
gpt_ragtest.js              # Test scripts
claude_ragtest.js           # Test scripts
```

### Generated Output
```
ml-contract-outputs/        # Generated contract outputs (optional)
feedback_results.log        # Log files
feedback_run_*.log          # Log files
```

### Old/Duplicate Versions
```
VS Extension V2/           # Old version folder
feedbackService.js          # Duplicate (already in src/services/)
```

### Personal/Private Files
```
.env                        # Environment variables (NEVER commit!)
*.key                       # API keys
*.pem                       # Certificates
resume_*.tex                # Personal files
```

### Large Data Files
```
*.csv                       # Large CSV files (if not needed)
*.whl                       # Python wheel files
*.tar.gz                    # Archives
```

## 📝 **RECOMMENDED .gitignore**

Create/update `.gitignore` with:

```gitignore
# Dependencies
node_modules/
package-lock.json

# Build output
out/
*.vsix

# Virtual environments
venv/
.venv/
ml_contract_persistent_venv_v2/
**/__pycache__/
*.pyc

# Environment variables
.env
.env.local

# Logs
*.log
logs/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Generated/Output
ml-contract-outputs/
*.csv
*.whl

# Test files (optional - include if you want)
# test_*.py
# *_test.js

# Old versions
VS Extension V2/
feedbackService.js

# Personal files
resume_*.tex
*.key
*.pem
```

## 🎯 **MINIMAL REPOSITORY STRUCTURE**

For a clean GitHub repository, you should have:

```
.
├── .gitignore
├── README.md
├── package.json
├── package-lock.json
├── env.example
├── src/
│   ├── extension.js
│   ├── services/
│   ├── rag/
│   ├── utils/
│   └── webview/
├── resources/
└── [Documentation .md files]
```

## 📋 **Quick Checklist**

- [ ] All source code in `src/`
- [ ] `package.json` included
- [ ] `README.md` included
- [ ] `.gitignore` configured
- [ ] `resources/` folder included
- [ ] `env.example` included (not `.env`)
- [ ] `node_modules/` excluded
- [ ] `out/` excluded
- [ ] `venv/` excluded
- [ ] `.env` excluded
- [ ] Log files excluded
- [ ] Old/duplicate files excluded

