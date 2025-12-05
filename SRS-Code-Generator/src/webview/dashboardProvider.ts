import * as vscode from 'vscode';
import * as path from 'path';
import { SRSDocumentParser } from '../services/srsParser';
import { CodeGenerator } from '../services/codeGenerator';

export class DashboardProvider {
    private panel: vscode.WebviewPanel | undefined;
    private context: vscode.ExtensionContext;
    private srsParser: SRSDocumentParser;
    private codeGenerator: CodeGenerator;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.srsParser = new SRSDocumentParser();
        this.codeGenerator = new CodeGenerator();
    }

    public showDashboard() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'srsCodeGeneratorDashboard',
            'SRS Code Generator Dashboard',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this.context.extensionUri]
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        // Handle messages from webview
        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.type) {
                    case 'uploadSRS':
                        await this.handleUploadSRS(message.data);
                        break;
                    case 'generateCode':
                        await this.handleGenerateCode(message.data);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        // Clean up when panel is closed
        this.panel.onDidDispose(
            () => {
                this.panel = undefined;
            },
            null,
            this.context.subscriptions
        );
    }

    private async handleUploadSRS(data: any) {
        try {
            // Show file picker for PDF
            const fileUri = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectMany: false,
                filters: {
                    'PDF files': ['pdf']
                }
            });

            if (!fileUri || fileUri.length === 0) {
                this.sendMessageToWebview('error', 'No file selected');
                return;
            }

            const filePath = fileUri[0].fsPath;
            
            // Parse the SRS document
            const functionalities = await this.srsParser.parseSRSDocument(filePath);
            
            if (functionalities.length === 0) {
                this.sendMessageToWebview('error', 'No functionalities found in the SRS document');
                return;
            }

            // Store functionalities in extension context
            this.context.globalState.update('srsFunctionalities', functionalities);
            
            // Send functionalities to webview
            this.sendMessageToWebview('functionalitiesLoaded', functionalities);
            
        } catch (error) {
            this.sendMessageToWebview('error', `Error parsing SRS document: ${error}`);
        }
    }

    private async handleGenerateCode(data: any) {
        try {
            const functionalities = this.context.globalState.get<any[]>('srsFunctionalities', []);
            const functionality = functionalities.find(f => f.name === data.functionalityName);
            
            if (!functionality) {
                this.sendMessageToWebview('error', 'Functionality not found');
                return;
            }

            // Generate code for the selected functionality
            const generatedCode = await this.codeGenerator.generateCode(functionality);
            
            // Create a new file with the generated code
            const fileName = `${functionality.name.replace(/\s+/g, '_')}.js`;
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            
            if (!workspaceFolder) {
                // If no workspace, ask user to open a folder or create a temporary location
                const openFolder = await vscode.window.showInformationMessage(
                    'No workspace folder found. Would you like to open a folder to save the generated code?',
                    'Open Folder',
                    'Create in Temp Location'
                );
                
                if (openFolder === 'Open Folder') {
                    const folderUri = await vscode.window.showOpenDialog({
                        canSelectFolders: true,
                        canSelectFiles: false,
                        canSelectMany: false,
                        openLabel: 'Select Folder for Generated Code'
                    });
                    
                    if (!folderUri || folderUri.length === 0) {
                        this.sendMessageToWebview('error', 'No folder selected');
                        return;
                    }
                    
                    const uri = vscode.Uri.file(path.join(folderUri[0].fsPath, fileName));
                    await this.createCodeFile(uri, generatedCode, functionality);
                    return;
                } else if (openFolder === 'Create in Temp Location') {
                    // Create in temp location
                    const tempDir = path.join(require('os').tmpdir(), 'srs-generated-code');
                    if (!require('fs').existsSync(tempDir)) {
                        require('fs').mkdirSync(tempDir, { recursive: true });
                    }
                    const uri = vscode.Uri.file(path.join(tempDir, fileName));
                    await this.createCodeFile(uri, generatedCode, functionality);
                    return;
                } else {
                    this.sendMessageToWebview('error', 'No workspace folder found');
                    return;
                }
            }

            const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, fileName));
            await this.createCodeFile(uri, generatedCode, functionality);
            
        } catch (error) {
            this.sendMessageToWebview('error', `Error generating code: ${error}`);
        }
    }

    private async createCodeFile(uri: vscode.Uri, generatedCode: string, functionality: any) {
        try {
            const document = await vscode.workspace.openTextDocument(uri);
            const edit = new vscode.WorkspaceEdit();
            edit.insert(uri, new vscode.Position(0, 0), generatedCode);
            
            await vscode.workspace.applyEdit(edit);
            await vscode.window.showTextDocument(document);
            
            this.sendMessageToWebview('codeGenerated', { 
                functionalityName: functionality.name,
                fileName: path.basename(uri.fsPath)
            });
        } catch (error) {
            this.sendMessageToWebview('error', `Error creating code file: ${error}`);
        }
    }

    private sendMessageToWebview(type: string, data: any) {
        if (this.panel) {
            this.panel.webview.postMessage({ type, data });
        }
    }

    private getWebviewContent(): string {
        // Return the embedded HTML content
        return this.getDashboardHTML();
    }

    private getDashboardHTML(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SRS Code Generator Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }

        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            color: #2c3e50;
            font-size: 2.5rem;
            margin-bottom: 10px;
            text-align: center;
        }

        .header p {
            color: #7f8c8d;
            text-align: center;
            font-size: 1.1rem;
        }

        .upload-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .upload-section h2 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }

        .upload-area {
            border: 2px dashed #3498db;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            background: #f8f9fa;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .upload-area:hover {
            border-color: #2980b9;
            background: #e3f2fd;
        }

        .upload-area.dragover {
            border-color: #27ae60;
            background: #e8f5e8;
        }

        .upload-icon {
            font-size: 3rem;
            color: #3498db;
            margin-bottom: 15px;
        }

        .upload-text {
            font-size: 1.2rem;
            color: #7f8c8d;
            margin-bottom: 10px;
        }

        .upload-button {
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .upload-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
        }

        .functionalities-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .functionalities-section h2 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 1.5rem;
        }

        .functionality-list {
            display: grid;
            gap: 15px;
        }

        .functionality-item {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .functionality-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
            border-color: #3498db;
        }

        .functionality-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
        }

        .functionality-description {
            color: #7f8c8d;
            margin-bottom: 10px;
            line-height: 1.4;
        }

        .functionality-context {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 5px;
            font-size: 0.9rem;
            color: #1976d2;
            margin-bottom: 10px;
        }

        .functionality-requirements {
            margin-top: 10px;
        }

        .requirements-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
        }

        .requirements-list {
            list-style: none;
            padding-left: 0;
        }

        .requirements-list li {
            padding: 2px 0;
            color: #7f8c8d;
            font-size: 0.9rem;
        }

        .requirements-list li:before {
            content: "•";
            color: #3498db;
            font-weight: bold;
            margin-right: 8px;
        }

        .generate-button {
            background: linear-gradient(45deg, #27ae60, #2ecc71);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .generate-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 3px 10px rgba(39, 174, 96, 0.4);
        }

        .status-section {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .status-section h2 {
            color: #2c3e50;
            margin-bottom: 15px;
            font-size: 1.5rem;
        }

        .status-item {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }

        .status-item:last-child {
            border-bottom: none;
        }

        .status-icon {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            border-radius: 50%;
        }

        .status-icon.success {
            background: #27ae60;
        }

        .status-icon.warning {
            background: #f39c12;
        }

        .status-icon.info {
            background: #3498db;
        }

        .status-text {
            color: #2c3e50;
            font-size: 0.9rem;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #7f8c8d;
        }

        .empty-state-icon {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.5;
        }

        .loading {
            display: none;
            text-align: center;
            padding: 20px;
        }

        .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .hidden {
            display: none;
        }

        .success-message {
            background: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #c3e6cb;
        }

        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="dashboard-container">
        <!-- Header -->
        <div class="header">
            <h1>🚀 SRS Code Generator</h1>
            <p>Transform your Software Requirements Specification into working code</p>
        </div>

        <!-- Upload Section -->
        <div class="upload-section">
            <h2>📄 Upload SRS Document</h2>
            <div class="upload-area" id="uploadArea">
                <div class="upload-icon">📁</div>
                <div class="upload-text">Drop your SRS PDF here or click to browse</div>
                <button class="upload-button" id="uploadButton">Choose PDF File</button>
                <input type="file" id="fileInput" accept=".pdf" style="display: none;">
            </div>
        </div>

        <!-- Functionalities Section -->
        <div class="functionalities-section">
            <h2>⚙️ Extracted Functionalities</h2>
            <div id="functionalityList" class="functionality-list">
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <p>Upload an SRS document to see extracted functionalities</p>
                </div>
            </div>
        </div>

        <!-- Status Section -->
        <div class="status-section">
            <h2>📊 Status</h2>
            <div id="statusList">
                <div class="status-item">
                    <div class="status-icon info"></div>
                    <div class="status-text">Ready to upload SRS document</div>
                </div>
            </div>
        </div>

        <!-- Loading -->
        <div class="loading" id="loading">
            <div class="loading-spinner"></div>
            <p>Processing SRS document...</p>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // DOM elements
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const uploadButton = document.getElementById('uploadButton');
        const functionalityList = document.getElementById('functionalityList');
        const statusList = document.getElementById('statusList');
        const loading = document.getElementById('loading');

        // Event listeners
        uploadButton.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', handleFileUpload);
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);

        // Handle file upload
        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (file && file.type === 'application/pdf') {
                uploadSRSDocument(file);
            } else {
                showError('Please select a valid PDF file.');
            }
        }

        // Handle drag and drop
        function handleDragOver(event) {
            event.preventDefault();
            uploadArea.classList.add('dragover');
        }

        function handleDragLeave(event) {
            event.preventDefault();
            uploadArea.classList.remove('dragover');
        }

        function handleDrop(event) {
            event.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = event.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                uploadSRSDocument(files[0]);
            } else {
                showError('Please drop a valid PDF file.');
            }
        }

        // Upload SRS document
        function uploadSRSDocument(file) {
            showLoading(true);
            updateStatus('Uploading SRS document...', 'info');
            
            // Send file to extension
            vscode.postMessage({
                type: 'uploadSRS',
                data: { fileName: file.name, fileSize: file.size }
            });
        }

        // Show/hide loading
        function showLoading(show) {
            loading.style.display = show ? 'block' : 'none';
        }

        // Update status
        function updateStatus(message, type = 'info') {
            const statusItem = document.createElement('div');
            statusItem.className = 'status-item';
            statusItem.innerHTML = \`
                <div class="status-icon \${type}"></div>
                <div class="status-text">\${message}</div>
            \`;
            statusList.insertBefore(statusItem, statusList.firstChild);
        }

        // Show error message
        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            uploadArea.appendChild(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        }

        // Show success message
        function showSuccess(message) {
            const successDiv = document.createElement('div');
            successDiv.className = 'success-message';
            successDiv.textContent = message;
            uploadArea.appendChild(successDiv);
            setTimeout(() => successDiv.remove(), 3000);
        }

        // Display functionalities
        function displayFunctionalities(functionalities) {
            if (functionalities.length === 0) {
                functionalityList.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <p>No functionalities found in the SRS document</p>
                    </div>
                \`;
                return;
            }

            functionalityList.innerHTML = functionalities.map(func => \`
                <div class="functionality-item" data-functionality='\${JSON.stringify(func)}'>
                    <div class="functionality-name">\${func.name}</div>
                    <div class="functionality-description">\${func.description}</div>
                    <div class="functionality-context">\${func.context}</div>
                    \${func.requirements && func.requirements.length > 0 ? \`
                        <div class="functionality-requirements">
                            <div class="requirements-title">Requirements:</div>
                            <ul class="requirements-list">
                                \${func.requirements.map(req => \`<li>\${req}</li>\`).join('')}
                            </ul>
                        </div>
                    \` : ''}
                    <button class="generate-button" onclick="generateCode('\${func.name}')">
                        🚀 Generate Code
                    </button>
                </div>
            \`).join('');
        }

        // Generate code for functionality
        function generateCode(functionalityName) {
            updateStatus(\`Generating code for \${functionalityName}...\`, 'info');
            vscode.postMessage({
                type: 'generateCode',
                data: { functionalityName }
            });
        }

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            
            switch (message.type) {
                case 'functionalitiesLoaded':
                    showLoading(false);
                    displayFunctionalities(message.data);
                    updateStatus(\`Found \${message.data.length} functionalities\`, 'success');
                    showSuccess('SRS document parsed successfully!');
                    break;
                    
                case 'codeGenerated':
                    updateStatus(\`Code generated for \${message.data.functionalityName}\`, 'success');
                    showSuccess('Code generated successfully!');
                    break;
                    
                case 'error':
                    showLoading(false);
                    updateStatus(message.data, 'warning');
                    showError(message.data);
                    break;
            }
        });

        // Initialize dashboard
        function initializeDashboard() {
            updateStatus('Dashboard ready', 'success');
        }

        // Start the dashboard
        initializeDashboard();
    </script>
</body>
</html>`;
    }

    private getFallbackHTML(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SRS Code Generator Dashboard</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    color: #333;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: rgba(255, 255, 255, 0.95);
                    border-radius: 15px;
                    padding: 30px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .error {
                    color: #e74c3c;
                    text-align: center;
                    padding: 20px;
                    background: #fdf2f2;
                    border-radius: 10px;
                    border: 1px solid #f5c6cb;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 SRS Code Generator Dashboard</h1>
                <div class="error">
                    <p>Dashboard HTML file not found. Please check the extension installation.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }
}
