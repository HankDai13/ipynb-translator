# 配置示例 / Configuration Examples

本文档提供了各种 API 提供商的配置示例，包括新的批量翻译设置。

## 智谱 AI (Zhipu AI)

```json
{
  "ipynbTranslator.provider": "zhipu",
  "ipynbTranslator.apiKey": "your-zhipu-api-key",
  "ipynbTranslator.modelName": "glm-4-flash",
  "ipynbTranslator.systemPrompt": "请将以下Markdown文本翻译成中文，只返回翻译后的内容，不要包含任何额外说明或Markdown语法外的字符。",
  "ipynbTranslator.concurrency": 3,
  "ipynbTranslator.skipCodeBlocks": true,
  "ipynbTranslator.skipMathFormulas": true
}
```

### 可用模型:
- `glm-4-flash` (免费额度)
- `glm-4-turbo`
- `glm-4-plus`
- `glm-4`

## 阿里百炼 (Aliyun Bailian)

```json
{
  "ipynbTranslator.provider": "aliyun",
  "ipynbTranslator.apiKey": "sk-your-dashscope-api-key",
  "ipynbTranslator.modelName": "qwen-turbo",
  "ipynbTranslator.systemPrompt": "Please translate the following Markdown text to Chinese. Only return the translated content without any additional explanations."
}
```

### 可用模型:
- `qwen-turbo` (高性价比)
- `qwen-plus` (平衡性能)
- `qwen-max` (最高性能)
- `qwen-math-plus`
- `qwen-coder-plus`

## 火山引擎 (Volcano Engine)

```json
{
  "ipynbTranslator.provider": "volcano",
  "ipynbTranslator.apiKey": "your-volcano-api-key",
  "ipynbTranslator.modelName": "doubao-lite-4k",
  "ipynbTranslator.systemPrompt": "翻译以下Markdown文本为中文，保持原有格式。"
}
```

### 可用模型:
- `doubao-lite-4k` (轻量级)
- `doubao-pro-4k` (专业版)
- `doubao-pro-32k` (长文本)
- `doubao-pro-128k` (超长文本)

## 自定义 API (Custom API)

### OpenAI API
```json
{
  "ipynbTranslator.provider": "custom",
  "ipynbTranslator.customApiUrl": "https://api.openai.com/v1/chat/completions",
  "ipynbTranslator.apiKey": "sk-your-openai-api-key",
  "ipynbTranslator.modelName": "gpt-3.5-turbo",
  "ipynbTranslator.systemPrompt": "Translate the following Markdown text to Chinese."
}
```

### Moonshot AI (月之暗面)
```json
{
  "ipynbTranslator.provider": "custom",
  "ipynbTranslator.customApiUrl": "https://api.moonshot.cn/v1/chat/completions",
  "ipynbTranslator.apiKey": "sk-your-moonshot-api-key",
  "ipynbTranslator.modelName": "moonshot-v1-8k",
  "ipynbTranslator.systemPrompt": "请翻译以下内容为中文。"
}
```

### DeepSeek API
```json
{
  "ipynbTranslator.provider": "custom",
  "ipynbTranslator.customApiUrl": "https://api.deepseek.com/v1/chat/completions",
  "ipynbTranslator.apiKey": "sk-your-deepseek-api-key",
  "ipynbTranslator.modelName": "deepseek-chat",
  "ipynbTranslator.systemPrompt": "Translate to Chinese:"
}
```

## 常用系统提示词

### 中英互译
```
请将以下Markdown文本翻译成中文，只返回翻译后的内容，不要包含任何额外说明或Markdown语法外的字符，为了保持翻译结果语义通顺，你应该恰当地使用意译，而不必与原文的顺序保持严格一致。
```

### 英译中 (保持格式)
```
翻译以下Markdown文本为中文，翻译结果必须保持原有的Markdown语法格式。
```

### 中译英
```
Translate the following Markdown text to English. Maintain the original Markdown syntax and formatting.
```

### 多语言支持
```
Translate the following Markdown text to [TARGET_LANGUAGE]. Keep all Markdown formatting intact.
```

## 故障排除

### 常见错误及解决方案

1. **401 Unauthorized**: 检查 API Key 是否正确
2. **403 Forbidden**: 检查 API Key 权限或余额
3. **429 Too Many Requests**: 请求频率过高，稍后重试
4. **500 Internal Server Error**: API 服务端错误，稍后重试

### 调试技巧

1. 打开 VS Code 开发者工具 (Help > Toggle Developer Tools)
2. 查看 Console 标签页的错误信息
3. 检查网络连接是否正常
4. 确认模型名称是否正确
