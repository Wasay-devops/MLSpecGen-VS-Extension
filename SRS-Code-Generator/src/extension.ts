import * as vscode from 'vscode';
import * as path from 'path';
import { SRSDocumentParser } from './services/srsParser';
import { CodeGenerator } from './services/codeGenerator';
import { FunctionalityProvider } from './providers/functionalityProvider';
import { DashboardProvider } from './webview/dashboardProvider';

export function activate(context: vscode.ExtensionContext) {
    console.log('SRS Code Generator extension is now active!');

    const srsParser = new SRSDocumentParser();
    const codeGenerator = new CodeGenerator();
    const functionalityProvider = new FunctionalityProvider(context);
    const dashboardProvider = new DashboardProvider(context);

    // Register command for uploading SRS document
    const uploadSRSCommand = vscode.commands.registerCommand('srs-code-generator.uploadSRS', async (uri?: vscode.Uri) => {
        try {
            let filePath: string;
            
            if (uri) {
                filePath = uri.fsPath;
            } else {
                const fileUri = await vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectMany: false,
                    filters: {
                        'PDF files': ['pdf']
                    }
                });
                
                if (!fileUri || fileUri.length === 0) {
                    return;
                }
                
                filePath = fileUri[0].fsPath;
            }

            vscode.window.showInformationMessage('Parsing SRS document...');
            
            // Parse the SRS document
            const functionalities = await srsParser.parseSRSDocument(filePath);
            
            if (functionalities.length === 0) {
                vscode.window.showWarningMessage('No functionalities found in the SRS document.');
                return;
            }

            // Store functionalities in extension context
            context.globalState.update('srsFunctionalities', functionalities);
            
            vscode.window.showInformationMessage(`Found ${functionalities.length} functionalities in the SRS document.`);
            
            // Show functionality selection
            await showFunctionalitySelection(functionalities, codeGenerator);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error parsing SRS document: ${error}`);
        }
    });

    // Register command for generating code
    const generateCodeCommand = vscode.commands.registerCommand('srs-code-generator.generateCode', async () => {
        const functionalities = context.globalState.get<any[]>('srsFunctionalities', []);
        
        if (functionalities.length === 0) {
            vscode.window.showWarningMessage('Please upload an SRS document first.');
            return;
        }

        await showFunctionalitySelection(functionalities, codeGenerator);
    });

    // Register command for opening dashboard
    const openDashboardCommand = vscode.commands.registerCommand('srs-code-generator.openDashboard', () => {
        dashboardProvider.showDashboard();
    });

    context.subscriptions.push(uploadSRSCommand, generateCodeCommand, openDashboardCommand);
}

async function showFunctionalitySelection(functionalities: any[], codeGenerator: CodeGenerator) {
    const functionalityNames = functionalities.map(f => f.name);
    
    const selectedFunctionality = await vscode.window.showQuickPick(functionalityNames, {
        placeHolder: 'Select a functionality to generate code for',
        title: 'SRS Functionalities'
    });

    if (!selectedFunctionality) {
        return;
    }

    const functionality = functionalities.find(f => f.name === selectedFunctionality);
    
    if (!functionality) {
        vscode.window.showErrorMessage('Functionality not found.');
        return;
    }

    try {
        vscode.window.showInformationMessage('Generating code...');
        
        // Generate code for the selected functionality
        const generatedCode = await codeGenerator.generateCode(functionality);
        
        // Create a new file with the generated code
        const fileName = `${functionality.name.replace(/\s+/g, '_')}.js`;
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        
        if (!workspaceFolder) {
            vscode.window.showErrorMessage('No workspace folder found. Please open a folder first.');
            return;
        }
        
        const uri = vscode.Uri.file(path.join(workspaceFolder.uri.fsPath, fileName));
        
        const document = await vscode.workspace.openTextDocument(uri);
        const edit = new vscode.WorkspaceEdit();
        edit.insert(uri, new vscode.Position(0, 0), generatedCode);
        
        await vscode.workspace.applyEdit(edit);
        await vscode.window.showTextDocument(document);
        
        vscode.window.showInformationMessage(`Code generated successfully for ${functionality.name}`);
        
    } catch (error) {
        vscode.window.showErrorMessage(`Error generating code: ${error}`);
    }
}

export function deactivate() {}
