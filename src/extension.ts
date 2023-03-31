// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { commands, window, env, Range } from 'vscode';
import { parse } from '@wordpress/block-serialization-default-parser';
import serialize from './serialize';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "php-array-from-json" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable;
    disposable = commands.registerCommand('wp-blocks-to-json.toJSON', async function () {
        const editor = window.activeTextEditor;
        let selectedText = editor.document.getText(editor.selection);
        if (selectedText.trim().length === 0) {
            selectedText = await env.clipboard.readText();
        }
        console.log('selectedText', selectedText)
        try {
            const json = parse(selectedText);
            const jsonText = JSON.stringify(json);
            editor.edit(editBuilder => {
                editBuilder.replace(
                    new Range(
                        editor.selection.start.line,
                        editor.selection.start.character,
                        editor.selection.end.line,
                        editor.selection.end.character
                    ),
                    jsonText
                );
            });
        } catch (exception) {
            console.log(exception); // see Dev Logs: https://stackoverflow.com/questions/34085330/how-to-write-to-log-from-vscode-extension
            window.showErrorMessage('Invalid Wordpress block-based HTML structure: ' + exception.message);
        }
    });

    disposable = commands.registerCommand('wp-blocks-to-json.fromJSON', async function () {
        const editor = window.activeTextEditor;
        let selectedText = editor.document.getText(editor.selection);
        if (selectedText.trim().length === 0) {
            selectedText = await env.clipboard.readText();
        }
        try {

            let json = JSON.parse(selectedText);

            // if (typeof json === 'object') {
            //     json = [json];
            // }

            // Parse the JSON block
            //const parsedBlocks = json.map(b => createBlock(b.name, b.attributes))

            // Serialize the parsed block to HTML
            const html = serialize(json, {});

            editor.edit(editBuilder => {
                editBuilder.replace(
                    new Range(
                        editor.selection.start.line,
                        editor.selection.start.character,
                        editor.selection.end.line,
                        editor.selection.end.character
                    ),
                    html
                );
            });
        } catch (exception) {
            console.log(exception); // see Dev Logs: https://stackoverflow.com/questions/34085330/how-to-write-to-log-from-vscode-extension
            window.showErrorMessage('Invalid JSON: ' + exception.message);
        }
    });

    context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() { }

module.exports = {
    activate,
    deactivate
}
