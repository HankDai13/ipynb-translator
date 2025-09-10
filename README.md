# ipynb-translator

A VS Code extension that translates Jupyter Notebook's Markdown cells using various LLM APIs including Zhipu AI, Aliyun Bailian, Volcano Engine, and custom OpenAI-compatible APIs. Display the translation result below the original cell.

### Demo

![Demo](https://raw.githubusercontent.com/nonenet/ipynb-translator/main/images/demo.gif)

## Features

- **Single Cell Translation**: Translates the selected Markdown cell in Jupyter Notebooks.
- **Batch Translation**: 🆕 Translate all Markdown cells in the notebook with one click.
- **Smart Content Filtering**: 🆕 Automatically skips code blocks and math formulas.
- **Performance Optimized**: 🆕 Concurrent translation with configurable concurrency limits.
- **Progress Tracking**: 🆕 Real-time progress bar for batch operations.
- Inserts the translated content as new Markdown cells directly below the original cells.
- **Multi-API Support**: Choose from multiple LLM providers:
  - **智谱 AI (Zhipu AI)** - glm-4-flash, glm-4-turbo, etc.
  - **阿里百炼 (Aliyun Bailian)** - qwen-max, qwen-turbo, etc.
  - **火山引擎 (Volcano Engine)** - doubao-pro-4k, doubao-lite-4k, etc.
  - **自定义 API (Custom API)** - Any OpenAI-compatible API endpoint

## Usage

### Single Cell Translation
1. Open a Jupyter Notebook (`.ipynb`) file in VS Code.
2. Select a Markdown cell you wish to translate.
3. Use one of these methods:
   - Press `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac)
   - Open Command Palette (`Ctrl+Shift+P`) and search for "Translate Markdown cell"
   - Click the translate button in the cell toolbar
4. The translated text will be inserted as a new cell below the original.

### Batch Translation (🆕 New Feature)
1. Open a Jupyter Notebook (`.ipynb`) file in VS Code.
2. Use one of these methods:
   - Press `Ctrl+Shift+Alt+T` (or `Cmd+Shift+Alt+T` on Mac)
   - Open Command Palette (`Ctrl+Shift+P`) and search for "Translate All Markdown cells"
   - Click the "Translate All" button in the notebook toolbar
3. Confirm the operation when prompted.
4. Watch the progress bar as all Markdown cells are translated concurrently.
5. Translated cells will be inserted below their corresponding original cells.

## Requirements

- Internet connection to access the LLM API.
- A valid API Key for your chosen provider.

## Extension Settings

* `ipynbTranslator.provider`: Choose your API provider (zhipu/aliyun/volcano/custom)
* `ipynbTranslator.apiKey`: API Key for the selected provider
  - [智谱 AI](https://open.bigmodel.cn/)
  - [阿里百炼](https://dashscope.aliyuncs.com/)
  - [火山引擎](https://console.volcengine.com/ark/)
* `ipynbTranslator.modelName`: Model name for the selected provider
  - **智谱 AI**: glm-4-flash, glm-4-turbo, glm-4-plus, etc.
  - **阿里百炼**: qwen-max, qwen-turbo, qwen-plus, etc.
  - **火山引擎**: doubao-pro-4k, doubao-lite-4k, doubao-pro-32k, etc.
* `ipynbTranslator.customApiUrl`: Custom API URL (only when provider is "custom")
* `ipynbTranslator.systemPrompt`: Your requirements for the translation, such as the target language
* `ipynbTranslator.concurrency`: 🆕 Number of concurrent translation requests (1-10, default: 3)
* `ipynbTranslator.skipCodeBlocks`: 🆕 Skip translating code blocks (default: true)
* `ipynbTranslator.skipMathFormulas`: 🆕 Skip translating math formulas (default: true)

## Quick Setup Guide

### 智谱 AI (Zhipu AI)
1. Set `provider` to `zhipu`
2. Get API key from [Zhipu AI Open Platform](https://open.bigmodel.cn/)
3. Set `modelName` to `glm-4-flash` (free tier available)

### 阿里百炼 (Aliyun Bailian)
1. Set `provider` to `aliyun`
2. Get API key from [DashScope Console](https://dashscope.aliyuncs.com/)
3. Set `modelName` to `qwen-turbo` or `qwen-max`

### 火山引擎 (Volcano Engine)
1. Set `provider` to `volcano`
2. Get API key from [Volcano Engine Console](https://console.volcengine.com/ark/)
3. Set `modelName` to `doubao-lite-4k` or `doubao-pro-4k`

### 自定义 API (Custom API)
1. Set `provider` to `custom`
2. Set `customApiUrl` to your OpenAI-compatible API endpoint
3. Set your `apiKey` and `modelName` according to your API provider

## Model Recommendations

| Provider | Free Models | Recommended Models | 
|----------|-------------|-------------------|
| 智谱 AI | glm-4-flash | glm-4-turbo, glm-4-plus |
| 阿里百炼 | qwen-turbo | qwen-max, qwen-plus |
| 火山引擎 | doubao-lite-4k | doubao-pro-4k, doubao-pro-32k |

## Release Notes

### 0.2.0 (Latest)
- 🆕 **Batch Translation**: Translate all Markdown cells with one click
- 🆕 **Smart Content Filtering**: Automatically skip code blocks and math formulas
- 🆕 **Performance Optimization**: Concurrent translation with configurable limits
- 🆕 **Progress Tracking**: Real-time progress bar for batch operations
- 🆕 **Enhanced Settings**: New configuration options for batch translation
- 🎯 **Improved UX**: Better error handling and user feedback
- 📱 **New Shortcuts**: `Ctrl+Shift+Alt+T` for batch translation

### 0.1.0
- ✨ Added multi-API provider support
- ✨ Support for Aliyun Bailian (阿里百炼)
- ✨ Support for Volcano Engine (火山引擎)
- ✨ Custom OpenAI-compatible API support
- 🔧 Improved configuration options
- 📚 Enhanced documentation

### 0.0.8
- Initial release with Zhipu AI support