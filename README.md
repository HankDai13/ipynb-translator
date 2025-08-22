# ipynb-translator

A VS Code extension that uses the Zhipu Large Model to translate Jupyter Notebook's Markdown cell into another language, and display the translation result below the original cell. The target language defaults to Chinese, and the default model used is glm-4-flash-250414 (which is **free** to use as of 2025-08-22).

### Demo

![Demo](https://raw.githubusercontent.com/nonenet/ipynb-translator/refs/heads/main/images/demo.gif)

## Features

- Translates the selected Markdown cell in Jupyter Notebooks.
- Inserts the translated content as a new Markdown cell directly below the original cell.

## Usage

1. Open a Jupyter Notebook (`.ipynb`) file in VS Code.
2. Select a Markdown cell you wish to translate.
3. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P),and search for "Translate Markdown cell in Jupyter Notebook" and  execute the command.Or use the keyboard shortcut (default: Ctrl+Shift+T or Cmd+Shift+P).
4. After a brief wait, a new Markdown cell containing the translated text will be inserted below the original cell.

## Requirements

- Internet connection to access the Zhipu AI API.
- A valid Zhipu AI API Key.

## Extension Settings

* `ipynbTranslator.apiKey`：Zhipu AI API Key.Click [here](https://open.bigmodel.cn/) to apply for a Zhipu API key.
* `ipynbTranslator.modelName`：LLM name.Default:glm-4-flash-250414
* `ipynbTranslator.systemPrompt`：Your requirements for the translation, such as the target language.