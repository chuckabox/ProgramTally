import * as vscode from 'vscode';

let statusBar: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    statusBar.show();

    const updateStats = () => {
        let totalLines = 0;
        let totalErrors = 0;

        // Lines
        vscode.workspace.textDocuments.forEach(doc => {
            totalLines += doc.lineCount;
        });

        // Errors/Warnings
        vscode.workspace.textDocuments.forEach(doc => {
            const diagnostics = vscode.languages.getDiagnostics(doc.uri);
            totalErrors += diagnostics.length;
        });

        statusBar.text = `Lines: ${totalLines} | Errors: ${totalErrors}`;
    };

    // Updates
    vscode.workspace.onDidChangeTextDocument(updateStats);
    vscode.languages.onDidChangeDiagnostics(updateStats);

    const disposable = vscode.commands.registerCommand('programtally.showApp', () => {
        const panel = vscode.window.createWebviewPanel(
            'programTallyApp', // internal identifier
            'ProgramTally App', // title
            vscode.ViewColumn.One, // show in first column
            { enableScripts: true } // allow JS
        );

        const updateWebview = () => {
            let totalLines = 0;
            let totalErrors = 0;

            vscode.workspace.textDocuments.forEach(doc => {
                totalLines += doc.lineCount;
                totalErrors += vscode.languages.getDiagnostics(doc.uri).length;
            });

            panel.webview.html = getWebviewContent(totalLines, totalErrors);
        };

        updateWebview();

        const docChange = vscode.workspace.onDidChangeTextDocument(updateWebview);
        const diagChange = vscode.languages.onDidChangeDiagnostics(updateWebview);

        panel.onDidDispose(() => {
            docChange.dispose();
            diagChange.dispose();
        });
    });

    context.subscriptions.push(disposable);
    context.subscriptions.push(statusBar);
}

export function deactivate() { }

function getWebviewContent(lines: number, errors: number) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>ProgramTally App</title>
        <style>
            body { font-family: sans-serif; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
            h1 { color: #007acc; }
            .stat { margin: 10px 0; font-size: 1.2em; }
        </style>
    </head>
    <body>
        <h1>ProgramTally Stats</h1>
        <div class="stat">Total Lines: ${lines}</div>
        <div class="stat">Total Errors: ${errors}</div>
    </body>
    </html>
    `;
}