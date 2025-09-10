import * as vscode from 'vscode';
import axios from 'axios';

// API 提供商配置
interface ApiProviderConfig {
	baseUrl: string;
	authHeader: (apiKey: string) => { [key: string]: string };
	requestBody: (modelName: string, systemPrompt: string, originalText: string) => any;
	extractResponse: (response: any) => string;
}

// 定义不同的 API 提供商配置
const API_PROVIDERS: { [key: string]: ApiProviderConfig } = {
	zhipu: {
		baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
		authHeader: (apiKey: string) => ({
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		}),
		requestBody: (modelName: string, systemPrompt: string, originalText: string) => {
			const body: any = {
				model: modelName,
				messages: [
					{ role: "user", content: `${systemPrompt}\n\n${originalText}` }
				],
				temperature: 0.95,
				top_p: 0.7,
				stream: false,
				max_tokens: 10240
			};
			
			// 如果是 4.5 模型，添加 thinking 配置
			if (modelName.includes('4.5')) {
				body.thinking = { type: 'disabled' };
			}
			
			return body;
		},
		extractResponse: (response: any) => response.data.choices[0].message.content
	},
	aliyun: {
		baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
		authHeader: (apiKey: string) => ({
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		}),
		requestBody: (modelName: string, systemPrompt: string, originalText: string) => ({
			model: modelName,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: originalText }
			],
			temperature: 0.7,
			max_tokens: 10240,
			stream: false
		}),
		extractResponse: (response: any) => response.data.choices[0].message.content
	},
	volcano: {
		baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
		authHeader: (apiKey: string) => ({
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json'
		}),
		requestBody: (modelName: string, systemPrompt: string, originalText: string) => ({
			model: modelName,
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: originalText }
			],
			temperature: 0.7,
			max_tokens: 10240,
			stream: false
		}),
		extractResponse: (response: any) => response.data.choices[0].message.content
	}
};

// 工具函数：检查文本是否需要翻译
function shouldTranslateText(text: string, skipCodeBlocks: boolean, skipMathFormulas: boolean): boolean {
	// 跳过空白内容
	if (!text.trim()) {
		return false;
	}
	
	// 跳过纯代码块
	if (skipCodeBlocks && /^```[\s\S]*```$/m.test(text.trim())) {
		return false;
	}
	
	// 跳过纯数学公式
	if (skipMathFormulas && /^\$\$?[\s\S]*\$\$?$/m.test(text.trim())) {
		return false;
	}
	
	// 跳过主要是代码块和公式的内容
	const codeBlockRegex = /```[\s\S]*?```/g;
	const mathFormulaRegex = /\$\$?[\s\S]*?\$\$?/g;
	
	let textWithoutCode = text;
	if (skipCodeBlocks) {
		textWithoutCode = textWithoutCode.replace(codeBlockRegex, '');
	}
	if (skipMathFormulas) {
		textWithoutCode = textWithoutCode.replace(mathFormulaRegex, '');
	}
	
	// 如果移除代码块和公式后，剩余文本太少，则跳过
	const remainingText = textWithoutCode.trim().replace(/\s+/g, ' ');
	return remainingText.length > 10; // 至少需要10个字符
}

// 工具函数：实现并发控制
async function translateWithConcurrencyControl<T>(
	items: T[], 
	concurrency: number, 
	translateFn: (item: T) => Promise<any>,
	progressCallback: (completed: number, total: number) => void
): Promise<any[]> {
	const results: any[] = new Array(items.length);
	let completed = 0;
	let index = 0;
	
	// 创建并发池
	const workers = Array(Math.min(concurrency, items.length)).fill(null).map(async () => {
		while (index < items.length) {
			const currentIndex = index++;
			const item = items[currentIndex];
			
			try {
				results[currentIndex] = await translateFn(item);
			} catch (error) {
				results[currentIndex] = { error, item };
			}
			
			completed++;
			progressCallback(completed, items.length);
		}
	});
	
	await Promise.all(workers);
	return results;
}

// 主要翻译函数
async function translateText(
	text: string,
	config: {
		provider: string;
		apiKey: string;
		modelName: string;
		systemPrompt: string;
		customApiUrl?: string;
	}
): Promise<string> {
	let apiUrl: string;
	let headers: { [key: string]: string };
	let requestBody: any;
	let extractResponse: (response: any) => string;

	if (config.provider === 'custom') {
		if (!config.customApiUrl) {
			throw new Error('Custom API URL is required');
		}
		apiUrl = config.customApiUrl;
		headers = {
			'Authorization': `Bearer ${config.apiKey}`,
			'Content-Type': 'application/json'
		};
		requestBody = {
			model: config.modelName,
			messages: [
				{ role: "system", content: config.systemPrompt },
				{ role: "user", content: text }
			],
			temperature: 0.7,
			max_tokens: 10240,
			stream: false
		};
		extractResponse = (response: any) => response.data.choices[0].message.content;
	} else {
		const providerConfig = API_PROVIDERS[config.provider];
		if (!providerConfig) {
			throw new Error(`Unsupported provider: ${config.provider}`);
		}

		apiUrl = providerConfig.baseUrl;
		headers = providerConfig.authHeader(config.apiKey);
		requestBody = providerConfig.requestBody(config.modelName, config.systemPrompt, text);
		extractResponse = providerConfig.extractResponse;
	}

	const response = await axios.post(apiUrl, requestBody, { headers });
	return extractResponse(response);
}

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
				const provider = config.get<string>('provider', 'zhipu');
				const API_KEY = config.get<string>('apiKey');
				const MODEL_NAME = config.get<string>('modelName', 'glm-4-flash');
				const SYSTEM_PROMPT = config.get<string>('systemPrompt', '请将以下Markdown文本翻译成中文，只返回翻译后的内容，不要包含任何额外说明或Markdown语法外的字符：');
				const CUSTOM_API_URL = config.get<string>('customApiUrl', '');

				if (!API_KEY) {
					vscode.window.showErrorMessage('Please configure the API Key in VS Code settings');
					return;
				}

				try {
					let apiUrl: string;
					let headers: { [key: string]: string };
					let requestBody: any;
					let extractResponse: (response: any) => string;

					if (provider === 'custom') {
						if (!CUSTOM_API_URL) {
							vscode.window.showErrorMessage('Please configure the custom API URL in VS Code settings');
							return;
						}
						// 自定义 API，使用 OpenAI 兼容格式
						apiUrl = CUSTOM_API_URL;
						headers = {
							'Authorization': `Bearer ${API_KEY}`,
							'Content-Type': 'application/json'
						};
						requestBody = {
							model: MODEL_NAME,
							messages: [
								{ role: "system", content: SYSTEM_PROMPT },
								{ role: "user", content: originalText }
							],
							temperature: 0.7,
							max_tokens: 10240,
							stream: false
						};
						extractResponse = (response: any) => response.data.choices[0].message.content;
					} else {
						// 使用预定义的 API 提供商
						const providerConfig = API_PROVIDERS[provider];
						if (!providerConfig) {
							vscode.window.showErrorMessage(`Unsupported provider: ${provider}`);
							return;
						}

						apiUrl = providerConfig.baseUrl;
						headers = providerConfig.authHeader(API_KEY);
						requestBody = providerConfig.requestBody(MODEL_NAME, SYSTEM_PROMPT, originalText);
						extractResponse = providerConfig.extractResponse;
					}

					const response = await axios.post(apiUrl, requestBody, { headers });
					const translatedText = extractResponse(response);

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
					vscode.window.setStatusBarMessage(`Translation completed using ${provider}!`, 2000);

				} catch (error: any) {
					// 如果出现错误，Promise 也将拒绝，withProgress 提示自行关闭
					let errorMessage = 'Translation failed';
					if (error.response) {
						errorMessage += `: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
					} else {
						errorMessage += `: ${error.message}`;
					}
					vscode.window.showErrorMessage(errorMessage);
					console.error('Translation error:', error.response ? error.response.data : error.message);
				}
			}
		);
	});

	// 注册批量翻译所有 Markdown 单元格命令
	let batchDisposable = vscode.commands.registerCommand('ipynb-translator.translateAllMarkdownCells', async () => {
		const editor = vscode.window.activeNotebookEditor;
		if (!editor) {
			vscode.window.showInformationMessage('Please open a Jupyter Notebook first');
			return;
		}

		const config = vscode.workspace.getConfiguration('ipynbTranslator');
		const provider = config.get<string>('provider', 'zhipu');
		const API_KEY = config.get<string>('apiKey');
		const MODEL_NAME = config.get<string>('modelName', 'glm-4-flash');
		const SYSTEM_PROMPT = config.get<string>('systemPrompt', '请将以下Markdown文本翻译成中文，只返回翻译后的内容，不要包含任何额外说明或Markdown语法外的字符：');
		const CUSTOM_API_URL = config.get<string>('customApiUrl', '');
		const CONCURRENCY = config.get<number>('concurrency', 3);
		const SKIP_CODE_BLOCKS = config.get<boolean>('skipCodeBlocks', true);
		const SKIP_MATH_FORMULAS = config.get<boolean>('skipMathFormulas', true);

		if (!API_KEY) {
			vscode.window.showErrorMessage('Please configure the API Key in VS Code settings');
			return;
		}

		// 获取所有 Markdown 单元格
		const markdownCells: { cell: vscode.NotebookCell; index: number; text: string }[] = [];
		
		for (let i = 0; i < editor.notebook.cellCount; i++) {
			const cell = editor.notebook.cellAt(i);
			if (cell.kind === vscode.NotebookCellKind.Markup) {
				const text = cell.document.getText();
				if (shouldTranslateText(text, SKIP_CODE_BLOCKS, SKIP_MATH_FORMULAS)) {
					markdownCells.push({ cell, index: i, text });
				}
			}
		}

		if (markdownCells.length === 0) {
			vscode.window.showInformationMessage('No translatable Markdown cells found in this notebook');
			return;
		}

		// 询问用户确认
		const choice = await vscode.window.showWarningMessage(
			`Found ${markdownCells.length} Markdown cells to translate. This will create ${markdownCells.length} new cells. Continue?`,
			'Yes', 'No'
		);

		if (choice !== 'Yes') {
			return;
		}

		// 使用进度条执行批量翻译
		await vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: 'Translating all Markdown cells...',
				cancellable: true
			},
			async (progress, token) => {
				let successful = 0;
				let failed = 0;

				const translationConfig = {
					provider,
					apiKey: API_KEY,
					modelName: MODEL_NAME,
					systemPrompt: SYSTEM_PROMPT,
					customApiUrl: CUSTOM_API_URL
				};

				try {
					const results = await translateWithConcurrencyControl(
						markdownCells,
						CONCURRENCY,
						async (cellInfo) => {
							if (token.isCancellationRequested) {
								throw new Error('Cancelled by user');
							}
							
							const translatedText = await translateText(cellInfo.text, translationConfig);
							return { cellInfo, translatedText };
						},
						(completed, total) => {
							progress.report({
								increment: (100 / total),
								message: `${completed}/${total} cells translated`
							});
						}
					);

					// 处理结果并插入翻译后的单元格
					// 从后往前插入，避免索引错位
					const successfulResults: { cellInfo: any; translatedText: string }[] = [];
					
					for (let i = 0; i < results.length; i++) {
						const result = results[i];
						
						if (result.error) {
							failed++;
							console.error(`Failed to translate cell ${i}:`, result.error);
							continue;
						}

						successful++;
						successfulResults.push(result);
					}

					// 按索引从后往前排序，确保插入时不影响前面的索引
					successfulResults.sort((a, b) => b.cellInfo.index - a.cellInfo.index);

					// 逐个插入翻译后的单元格
					for (const { cellInfo, translatedText } of successfulResults) {
						const newCellData = new vscode.NotebookCellData(
							vscode.NotebookCellKind.Markup,
							translatedText,
							'markdown'
						);
						
						const insertIndex = cellInfo.index + 1;
						
						const edit = new vscode.WorkspaceEdit();
						edit.set(
							editor.notebook.uri,
							[
								new vscode.NotebookEdit(
									new vscode.NotebookRange(insertIndex, insertIndex),
									[newCellData]
								)
							]
						);
						
						await vscode.workspace.applyEdit(edit);
					}

					// 显示完成统计
					const message = `Batch translation completed! ${successful} successful, ${failed} failed.`;
					if (failed > 0) {
						vscode.window.showWarningMessage(message);
					} else {
						vscode.window.showInformationMessage(message);
					}
					
					vscode.window.setStatusBarMessage(`Batch translation completed: ${successful}/${markdownCells.length}`, 3000);

				} catch (error: any) {
					if (error.message === 'Cancelled by user') {
						vscode.window.showInformationMessage('Translation cancelled by user');
					} else {
						let errorMessage = 'Batch translation failed';
						if (error.response) {
							errorMessage += `: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
						} else {
							errorMessage += `: ${error.message}`;
						}
						vscode.window.showErrorMessage(errorMessage);
						console.error('Batch translation error:', error);
					}
				}
			}
		);
	});

	// 将注册的命令添加到订阅中，以便在插件停用时自动清理
	context.subscriptions.push(disposable);
	context.subscriptions.push(batchDisposable);
}

// 插件停用时调用此方法
export function deactivate() {}