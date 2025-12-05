# SRS Code Generator

A VS Code extension that generates code from Software Requirements Specification (SRS) documents.

## Features

- **PDF SRS Document Parsing**: Upload and parse PDF SRS documents to extract functionalities
- **Functionality Extraction**: Automatically identifies and extracts implementable functionalities from SRS documents
- **Code Generation**: Generate JavaScript code for selected functionalities using AI/LLM
- **Interactive UI**: Easy-to-use interface for selecting functionalities and generating code

## How It Works

1. **Upload SRS Document**: Right-click on a PDF file in the explorer or use the command palette to upload an SRS document
2. **Parse Functionalities**: The extension automatically parses the document and extracts functionalities with their context
3. **Select Functionality**: Choose from a dropdown list of extracted functionalities
4. **Generate Code**: The extension generates JavaScript code for the selected functionality

## Installation

1. Clone or download this extension
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile TypeScript
4. Press F5 to run the extension in a new Extension Development Host window

## Configuration

### OpenAI API (Optional)

To use AI-powered code generation, set up your OpenAI API key:

1. Set the `OPENAI_API_KEY` environment variable
2. Optionally set `OPENAI_BASE_URL` if using a different endpoint

Without API configuration, the extension will generate template code.

## Usage

### Upload SRS Document

1. Right-click on a PDF file in the VS Code explorer
2. Select "Upload SRS Document" from the context menu
3. Or use the Command Palette (Ctrl+Shift+P) and search for "Upload SRS Document"

### Generate Code

1. Use the Command Palette (Ctrl+Shift+P)
2. Search for "Generate Code from Functionality"
3. Select the functionality you want to generate code for
4. The generated code will be created as a new file in your workspace

## Supported SRS Formats

The extension can parse various SRS document formats including:

- Use case diagrams
- Functional requirements
- System specifications
- Module descriptions
- Component requirements

## Generated Code Features

- Clean, well-structured JavaScript code
- Proper error handling
- Input validation
- Comprehensive comments
- Example usage
- Export statements for reusability

## Dependencies

- `pdf-parse`: For parsing PDF documents
- `openai`: For AI-powered code generation (optional)
- `axios`: For HTTP requests

## Development

### Project Structure

```
src/
├── extension.ts              # Main extension entry point
├── services/
│   ├── srsParser.ts         # PDF parsing and functionality extraction
│   └── codeGenerator.ts      # Code generation logic
└── providers/
    └── functionalityProvider.ts # Tree view provider for functionalities
```

### Building

```bash
npm run compile
```

### Testing

1. Press F5 to run the extension in a new window
2. Test with sample SRS documents
3. Verify functionality extraction and code generation

## Troubleshooting

### No Functionalities Found

- Ensure your SRS document contains clear functionality descriptions
- Check that the document is properly formatted with section headers
- Try with a different SRS document format

### Code Generation Issues

- Verify your OpenAI API key is correctly set
- Check your internet connection for API calls
- The extension will fall back to template generation if API calls fail

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

