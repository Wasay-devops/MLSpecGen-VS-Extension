# Multi-Model LLM Support - Implementation Plan

## 🎯 Why This Is Critical

### Current Limitations
- **Single Provider**: Only OpenAI GPT-4o
- **No Fallback**: If OpenAI API is down/rate-limited, extension fails
- **Cost**: GPT-4o is expensive for high-volume usage
- **Privacy**: All code sent to external API
- **No Choice**: Users can't pick their preferred model

### Benefits of Multi-Model Support
1. **Cost Reduction**: Use cheaper models (Claude Sonnet, Gemini Pro) or free local models (Ollama)
2. **Privacy**: Local models keep code on-device (Ollama, LM Studio)
3. **Reliability**: Automatic fallback if one provider fails
4. **Performance**: Different models for different tasks (fast model for classification, powerful model for generation)
5. **User Choice**: Let users pick based on cost/quality/privacy preferences

---

## 🏗️ Architecture Design

### 1. Abstract LLM Interface

Create a unified interface that all models implement:

```javascript
// src/llm/llmProvider.js
class LLMProvider {
    async chat(messages, options = {}) {
        throw new Error('Not implemented');
    }
    
    async classify(codeAnalysis, context) {
        throw new Error('Not implemented');
    }
    
    async generateContracts(codeAnalysis, label, context) {
        throw new Error('Not implemented');
    }
    
    getModelName() {
        throw new Error('Not implemented');
    }
    
    getCostEstimate(tokens) {
        throw new Error('Not implemented');
    }
}
```

### 2. Provider Implementations

#### OpenAI Provider (Current)
```javascript
// src/llm/providers/openaiProvider.js
class OpenAIProvider extends LLMProvider {
    constructor(apiKey, model = 'gpt-4o') {
        this.client = new OpenAI({ apiKey });
        this.model = model;
    }
    
    async chat(messages, options) {
        return await this.client.chat.completions.create({
            model: this.model,
            messages,
            ...options
        });
    }
}
```

#### Anthropic Claude Provider
```javascript
// src/llm/providers/claudeProvider.js
class ClaudeProvider extends LLMProvider {
    constructor(apiKey, model = 'claude-3-5-sonnet-20241022') {
        this.client = new Anthropic({ apiKey });
        this.model = model;
    }
    
    async chat(messages, options) {
        // Convert OpenAI format to Claude format
        const systemMessage = messages.find(m => m.role === 'system')?.content || '';
        const conversationMessages = messages.filter(m => m.role !== 'system');
        
        return await this.client.messages.create({
            model: this.model,
            max_tokens: options.max_tokens || 4096,
            system: systemMessage,
            messages: conversationMessages
        });
    }
}
```

#### Google Gemini Provider
```javascript
// src/llm/providers/geminiProvider.js
class GeminiProvider extends LLMProvider {
    constructor(apiKey, model = 'gemini-1.5-pro') {
        this.client = new GoogleGenerativeAI(apiKey);
        this.model = this.client.getGenerativeModel({ model });
    }
    
    async chat(messages, options) {
        // Convert to Gemini format
        const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
        const result = await this.model.generateContent(prompt);
        return { choices: [{ message: { content: result.response.text() } }] };
    }
}
```

#### Ollama (Local) Provider
```javascript
// src/llm/providers/ollamaProvider.js
class OllamaProvider extends LLMProvider {
    constructor(baseUrl = 'http://127.0.0.1:11434', model = 'llama3.1:8b') {
        this.baseUrl = baseUrl;
        this.model = model;
    }
    
    async chat(messages, options) {
        const response = await axios.post(`${this.baseUrl}/api/chat`, {
            model: this.model,
            messages: messages,
            stream: false,
            options: {
                temperature: options.temperature || 0.7,
                num_predict: options.max_tokens || 2048
            }
        });
        
        return {
            choices: [{
                message: {
                    content: response.data.message.content
                }
            }]
        };
    }
}
```

### 3. Model Manager with Fallback

```javascript
// src/llm/modelManager.js
class ModelManager {
    constructor(config) {
        this.providers = [];
        this.primaryProvider = null;
        this.fallbackProviders = [];
        this.loadProviders(config);
    }
    
    loadProviders(config) {
        // Primary provider
        if (config.openai?.apiKey) {
            this.primaryProvider = new OpenAIProvider(
                config.openai.apiKey,
                config.openai.model || 'gpt-4o'
            );
        }
        
        // Fallback providers (in order)
        if (config.claude?.apiKey) {
            this.fallbackProviders.push(new ClaudeProvider(
                config.claude.apiKey,
                config.claude.model || 'claude-3-5-sonnet-20241022'
            ));
        }
        
        if (config.gemini?.apiKey) {
            this.fallbackProviders.push(new GeminiProvider(
                config.gemini.apiKey,
                config.gemini.model || 'gemini-1.5-pro'
            ));
        }
        
        if (config.ollama?.enabled) {
            this.fallbackProviders.push(new OllamaProvider(
                config.ollama.baseUrl || 'http://127.0.0.1:11434',
                config.ollama.model || 'llama3.1:8b'
            ));
        }
    }
    
    async chat(messages, options = {}) {
        // Try primary provider first
        try {
            return await this.primaryProvider.chat(messages, options);
        } catch (error) {
            console.warn(`Primary provider failed: ${error.message}, trying fallbacks...`);
            
            // Try fallback providers
            for (const provider of this.fallbackProviders) {
                try {
                    return await provider.chat(messages, options);
                } catch (fallbackError) {
                    console.warn(`Fallback provider ${provider.getModelName()} failed: ${fallbackError.message}`);
                    continue;
                }
            }
            
            throw new Error('All LLM providers failed');
        }
    }
    
    // Use different models for different tasks
    async classify(codeAnalysis, context) {
        // Use faster/cheaper model for classification
        const fastProvider = this.fallbackProviders.find(p => 
            p.getModelName().includes('sonnet') || 
            p.getModelName().includes('gemini-pro')
        ) || this.primaryProvider;
        
        return await fastProvider.classify(codeAnalysis, context);
    }
    
    async generateContracts(codeAnalysis, label, context) {
        // Use more powerful model for generation
        return await this.primaryProvider.generateContracts(codeAnalysis, label, context);
    }
}
```

---

## ⚙️ Configuration

### VS Code Settings

```json
// package.json - configuration section
"configuration": {
    "title": "ML Contract Detector",
    "properties": {
        "mlContract.llm.provider": {
            "type": "string",
            "enum": ["openai", "claude", "gemini", "ollama", "auto"],
            "default": "auto",
            "description": "Primary LLM provider. 'auto' uses OpenAI with fallbacks."
        },
        "mlContract.llm.openai.apiKey": {
            "type": "string",
            "default": "",
            "description": "OpenAI API key"
        },
        "mlContract.llm.openai.model": {
            "type": "string",
            "default": "gpt-4o",
            "description": "OpenAI model to use"
        },
        "mlContract.llm.claude.apiKey": {
            "type": "string",
            "default": "",
            "description": "Anthropic Claude API key"
        },
        "mlContract.llm.claude.model": {
            "type": "string",
            "default": "claude-3-5-sonnet-20241022",
            "description": "Claude model to use"
        },
        "mlContract.llm.gemini.apiKey": {
            "type": "string",
            "default": "",
            "description": "Google Gemini API key"
        },
        "mlContract.llm.gemini.model": {
            "type": "string",
            "default": "gemini-1.5-pro",
            "description": "Gemini model to use"
        },
        "mlContract.llm.ollama.enabled": {
            "type": "boolean",
            "default": false,
            "description": "Enable local Ollama models"
        },
        "mlContract.llm.ollama.baseUrl": {
            "type": "string",
            "default": "http://127.0.0.1:11434",
            "description": "Ollama server URL"
        },
        "mlContract.llm.ollama.model": {
            "type": "string",
            "default": "llama3.1:8b",
            "description": "Ollama model to use"
        },
        "mlContract.llm.useFastModelForClassification": {
            "type": "boolean",
            "default": true,
            "description": "Use faster/cheaper model for classification tasks"
        }
    }
}
```

### Environment Variables (Fallback)

```env
# .env file
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
OLLAMA_ENABLED=true
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.1:8b
```

---

## 📦 Dependencies to Add

```json
// package.json
"dependencies": {
    "openai": "^4.0.0",           // Already have
    "@anthropic-ai/sdk": "^0.20.0",  // NEW
    "@google/generative-ai": "^0.2.0", // NEW
    "axios": "^1.6.0"             // Already have (for Ollama)
}
```

---

## 🔄 Migration Plan

### Phase 1: Abstract Interface (Week 1)
1. Create `LLMProvider` base class
2. Refactor existing OpenAI code to `OpenAIProvider`
3. Update `RAGService` to use provider interface
4. Test that existing functionality still works

### Phase 2: Add Claude Support (Week 2)
1. Implement `ClaudeProvider`
2. Add Claude configuration
3. Test classification and generation with Claude
4. Add fallback logic

### Phase 3: Add Gemini & Ollama (Week 3)
1. Implement `GeminiProvider` and `OllamaProvider`
2. Add configuration for both
3. Test all providers
4. Add provider selection UI in dashboard

### Phase 4: Smart Model Selection (Week 4)
1. Implement task-specific model selection (fast for classification, powerful for generation)
2. Add cost estimation
3. Add provider health checking
4. Add usage statistics

---

## 💡 Smart Features

### 1. Task-Specific Model Selection
```javascript
// Use cheaper model for classification
async classify() {
    const model = this.getFastModel(); // Claude Sonnet or Gemini Pro
    return await model.classify(...);
}

// Use powerful model for generation
async generateContracts() {
    const model = this.getPowerfulModel(); // GPT-4o or Claude Opus
    return await model.generateContracts(...);
}
```

### 2. Cost Tracking
```javascript
class CostTracker {
    trackUsage(provider, tokens, task) {
        const cost = provider.getCostEstimate(tokens);
        this.totalCost += cost;
        console.log(`Task: ${task}, Provider: ${provider.getModelName()}, Cost: $${cost}`);
    }
}
```

### 3. Provider Health Check
```javascript
async checkProviderHealth(provider) {
    try {
        const response = await provider.chat([
            { role: 'user', content: 'test' }
        ], { max_tokens: 10 });
        return { healthy: true, latency: response.latency };
    } catch (error) {
        return { healthy: false, error: error.message };
    }
}
```

### 4. Model Comparison UI
Add to dashboard:
- Current provider indicator
- Cost per request estimate
- Switch provider button
- Provider health status
- Usage statistics

---

## 🎯 Recommended Model Pairings

### Cost-Optimized
- **Classification**: Claude Sonnet 3.5 (fast, cheap)
- **Generation**: Gemini 1.5 Pro (good quality, cheaper than GPT-4o)

### Quality-Optimized
- **Classification**: GPT-4o-mini (fast, accurate)
- **Generation**: GPT-4o or Claude Opus (best quality)

### Privacy-Optimized
- **All Tasks**: Ollama with Llama 3.1 70B (local, no data leaves device)

### Balanced (Recommended)
- **Classification**: Claude Sonnet 3.5
- **Generation**: GPT-4o
- **Fallback**: Ollama (if APIs fail)

---

## 📊 Expected Benefits

1. **Cost Reduction**: 50-70% cheaper using Claude Sonnet for classification
2. **Reliability**: 99.9% uptime with fallback providers
3. **Privacy**: Option for 100% local processing with Ollama
4. **Performance**: Faster classification with optimized models
5. **User Choice**: Let users pick based on their needs

---

## 🚀 Quick Start Implementation

Want to implement this? Start with:

1. **Create abstract interface** (`src/llm/llmProvider.js`)
2. **Refactor OpenAI** to use interface
3. **Add Claude support** (easiest to add, good quality)
4. **Add fallback logic**
5. **Add configuration UI**

This gives you 80% of the benefits with 20% of the work!












