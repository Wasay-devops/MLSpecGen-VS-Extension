# Repository Structure Plan (GILT_Artifacts Style)

Based on [GILT_Artifacts repository](https://github.com/namdy0429/GILT_Artifacts), here's the proposed structure:

## Proposed Structure

```
.
├── README.md                    # Main README (like GILT_Artifacts)
├── LICENSE                      # MIT License (if applicable)
├── .gitignore                   # Git ignore rules
│
├── MLSpecGen/                   # Main extension folder (like /GILT)
│   ├── README.md               # Extension-specific README
│   ├── package.json            # Extension manifest
│   ├── package-lock.json       # Dependency lock
│   ├── env.example             # Environment template
│   ├── src/                    # Extension source code
│   │   ├── extension.js
│   │   ├── services/
│   │   ├── rag/
│   │   ├── utils/
│   │   └── webview/
│   └── resources/              # Extension resources
│       ├── actionable_examples.txt
│       ├── kerasembedded_examples.json
│       ├── pycontracts_deep.txt
│       ├── pycontracts_doc.txt
│       └── research_context.txt
│
├── artifacts/                   # Research artifacts (like /study)
│   ├── README.md               # Artifacts documentation
│   ├── examples/               # Example outputs
│   │   └── ml-contract-outputs/
│   ├── documentation/          # Research documentation
│   │   ├── EXTENSION_DESCRIPTION.md
│   │   ├── EXTENSION_SUMMARY.md
│   │   ├── VERSIONING_STRATEGY.md
│   │   ├── VENV_LIBRARIES.md
│   │   ├── FIXES_APPLIED.md
│   │   └── FEEDBACK_LOOP_INTEGRATION.md
│   └── datasets/               # Research datasets
│       ├── KerasUnseen_top10.csv
│       ├── Tensorflow_Top10_unseen.csv
│       └── Tensorflow_Unseen.csv
│
└── [Optional: Paper PDF if you have one]
```

## Current vs. Proposed Mapping

### Move to MLSpecGen/
- `src/` → `MLSpecGen/src/`
- `package.json` → `MLSpecGen/package.json`
- `package-lock.json` → `MLSpecGen/package-lock.json`
- `env.example` → `MLSpecGen/env.example`
- `resources/` → `MLSpecGen/resources/`

### Move to artifacts/
- `EXTENSION_DESCRIPTION.md` → `artifacts/documentation/`
- `EXTENSION_SUMMARY.md` → `artifacts/documentation/`
- `VERSIONING_STRATEGY.md` → `artifacts/documentation/`
- `VENV_LIBRARIES.md` → `artifacts/documentation/`
- `FIXES_APPLIED.md` → `artifacts/documentation/`
- `FEEDBACK_LOOP_INTEGRATION.md` → `artifacts/documentation/`
- `ml-contract-outputs/` → `artifacts/examples/ml-contract-outputs/`
- `*.csv` files → `artifacts/datasets/`

### Keep in Root
- `README.md` (main README)
- `.gitignore`
- `LICENSE` (if you have one)

### Exclude/Delete
- `VS Extension V2/` (old version)
- `SRS-Code-Generator/` (separate project?)
- `feedbackService.js` (duplicate)
- `test_*.py` (test files - optional)
- `*.log` files
- `resume_*.tex` (personal files)

## Benefits

1. **Clean Structure**: Clear separation between extension code and research artifacts
2. **Professional**: Similar to academic/research repositories
3. **Easy Navigation**: Users know where to find extension vs. research materials
4. **Scalable**: Easy to add more artifacts or documentation later

## Next Steps

1. Create the new folder structure
2. Move files to appropriate locations
3. Update README.md to reflect new structure
4. Update any path references in code (if needed)
5. Test that extension still works

