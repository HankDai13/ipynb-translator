import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('ipynb-translator.translateMarkdownCell', async () => {
		const editor = vscode.window.activeNotebookEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Please select a Markdown cell in a Jupyter Notebook');
			return;
		}

		const selectedCell = editor.notebook.cellAt(editor.selection.start);

		if (selectedCell.kind !== vscode.NotebookCellKind.Markup) {
			vscode.window.showInformationMessage('Please select a markdown cell to translate');
			return;
		}

		const originalText = selectedCell.document.getText();
		vscode.window.showInformationMessage(`Translating: ${originalText.substring(0, Math.min(originalText.length, 50))}...`);

		const config = vscode.workspace.getConfiguration('ipynbTranslator');
		const API_KEY = config.get<string>('apiKey');
		const SYSTEM_PROMPT = config.get<string>('systemPrompt', '请将以下Markdown文本翻译成中文，只返回翻译后的内容，不要包含任何额外说明或Markdown语法外的字符：');

		if (!API_KEY) {
			vscode.window.showErrorMessage('Please configure the API Key of BigModel in VS Code settings');
			return;
		}

		const MODEL_NAME = config.get<string>('modelName', 'glm-4-flash-250414');
		const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

		try {
			const requestBody: any = {
				model: MODEL_NAME,
				messages: [
					{ role: "user", content: `${SYSTEM_PROMPT}\n\n${originalText}` }
				],
				temperature: 0.95,
				top_p: 0.7,
				stream: false,
				max_tokens: 10240
			};
			
			if (MODEL_NAME.includes('4.5')) {
				requestBody.thinking = {
					type: 'disabled' // 设置为不思考
				};
			}
			const response = await axios.post(API_URL, requestBody, {
				headers: {
					'Authorization': `Bearer ${API_KEY}`,
					'Content-Type': 'application/json'
				}
			});

			const translatedText = response.data.choices[0].message.content;

			const newCellData = new vscode.NotebookCellData(
				vscode.NotebookCellKind.Markup,
				`${translatedText}`,
				'markdown'
			);

			const edit = new vscode.WorkspaceEdit();
			edit.set(
				editor.notebook.uri,
				[
					new vscode.NotebookEdit(
						new vscode.NotebookRange(selectedCell.index + 1, selectedCell.index + 1),
						[newCellData]
					)
				]
			);
			await vscode.workspace.applyEdit(edit);

			const successMessage = vscode.window.setStatusBarMessage('Translation completed!', 2000);

		} catch (error: any) {
			vscode.window.showErrorMessage(`Translation failed: ${error.message}`);
			console.error('Translation error:', error.response ? error.response.data : error.message);
		}
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}


