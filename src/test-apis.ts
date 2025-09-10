/**
 * Test script for API integrations
 * This script can be used to test different API providers
 */

import axios from 'axios';

// Test configuration
interface TestConfig {
    provider: string;
    apiKey: string;
    modelName: string;
    baseUrl: string;
    testText: string;
}

// Example test configurations (replace with your actual API keys)
const testConfigs: { [key: string]: TestConfig } = {
    zhipu: {
        provider: 'zhipu',
        apiKey: 'your-zhipu-api-key',
        modelName: 'glm-4-flash',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        testText: 'Hello, world!'
    },
    aliyun: {
        provider: 'aliyun',
        apiKey: 'sk-your-dashscope-api-key',
        modelName: 'qwen-turbo',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        testText: 'Hello, world!'
    },
    volcano: {
        provider: 'volcano',
        apiKey: 'your-volcano-api-key',
        modelName: 'doubao-lite-4k',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        testText: 'Hello, world!'
    }
};

async function testProvider(config: TestConfig) {
    console.log(`Testing ${config.provider} provider...`);
    
    try {
        const systemPrompt = 'Translate the following text to Chinese:';
        
        let requestBody: any;
        if (config.provider === 'zhipu') {
            requestBody = {
                model: config.modelName,
                messages: [
                    { role: "user", content: `${systemPrompt}\n\n${config.testText}` }
                ],
                temperature: 0.7,
                stream: false,
                max_tokens: 1024
            };
        } else {
            requestBody = {
                model: config.modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: config.testText }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                stream: false
            };
        }

        const response = await axios.post(config.baseUrl, requestBody, {
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const translatedText = response.data.choices[0].message.content;
        console.log(`✅ ${config.provider} test successful!`);
        console.log(`Original: ${config.testText}`);
        console.log(`Translated: ${translatedText}`);
        console.log('---');
        
        return true;
    } catch (error: any) {
        console.log(`❌ ${config.provider} test failed!`);
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Error: ${JSON.stringify(error.response.data)}`);
        } else {
            console.log(`Error: ${error.message}`);
        }
        console.log('---');
        
        return false;
    }
}

async function runTests() {
    console.log('🧪 Starting API provider tests...\n');
    
    const results: { [key: string]: boolean } = {};
    
    for (const [providerName, config] of Object.entries(testConfigs)) {
        // Skip test if API key is not configured
        if (config.apiKey.startsWith('your-') || !config.apiKey) {
            console.log(`⏭️  Skipping ${providerName} (API key not configured)`);
            console.log('---');
            continue;
        }
        
        results[providerName] = await testProvider(config);
        
        // Add delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Test Results Summary:');
    for (const [provider, success] of Object.entries(results)) {
        console.log(`${success ? '✅' : '❌'} ${provider}`);
    }
}

// Uncomment the following line to run tests
// runTests().catch(console.error);

export { testProvider, runTests };
