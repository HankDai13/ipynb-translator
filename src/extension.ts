import * as vscode from 'vscode';
import axios from 'axios';

// 插件激活时调用此方法
export function activate(context: vscode.ExtensionContext) {

	// 注册翻译命令
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
		
		// 使用 withProgress 封装整个翻译过程，以实现自动关闭的通知
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Translating...',
				cancellable: false
			},
			async (progress) => {
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
							type: 'disabled'
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
					
					// 任务完成后，Promise 自动解决，withProgress 提示自行关闭
					// 我们可以在这里添加一个成功的状态栏提示
					vscode.window.setStatusBarMessage('Translation completed!', 2000);

				} catch (error: any) {
					// 如果出现错误，Promise 也将拒绝，withProgress 提示自行关闭
					vscode.window.showErrorMessage(`Translation failed: ${error.message}`);
					console.error('Translation error:', error.response ? error.response.data : error.message);
				}
			}
		);
	});

	// 将注册的命令添加到订阅中，以便在插件停用时自动清理
	context.subscriptions.push(disposable);
}

// 插件停用时调用此方法
export function deactivate() {}