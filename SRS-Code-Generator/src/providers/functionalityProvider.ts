import * as vscode from 'vscode';
import { Functionality } from '../services/srsParser';

export class FunctionalityProvider implements vscode.TreeDataProvider<FunctionalityItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<FunctionalityItem | undefined | null | void> = new vscode.EventEmitter<FunctionalityItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<FunctionalityItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private functionalities: Functionality[] = [];

    constructor(private context: vscode.ExtensionContext) {}

    refresh(functionalities: Functionality[]): void {
        this.functionalities = functionalities;
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: FunctionalityItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FunctionalityItem): Thenable<FunctionalityItem[]> {
        if (!element) {
            return Promise.resolve(this.functionalities.map(func => new FunctionalityItem(func)));
        }
        return Promise.resolve([]);
    }

    getParent(element: FunctionalityItem): vscode.ProviderResult<FunctionalityItem> {
        return null;
    }
}

export class FunctionalityItem extends vscode.TreeItem {
    constructor(
        public readonly functionality: Functionality,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
    ) {
        super(functionality.name, collapsibleState);
        
        this.tooltip = `${functionality.description}\n\nContext: ${functionality.context}`;
        this.description = functionality.description.substring(0, 50) + '...';
        this.contextValue = 'functionality';
        
        // Add icon
        this.iconPath = new vscode.ThemeIcon('symbol-function');
        
        // Add command to generate code
        this.command = {
            command: 'srs-code-generator.generateCodeForFunctionality',
            title: 'Generate Code',
            arguments: [functionality]
        };
    }
}

