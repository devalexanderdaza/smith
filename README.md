# Smith AI Agent Framework

![Smith Logo](https://img.shields.io/badge/Smith-AI%20Framework-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.14+-green)

Smith is a powerful TypeScript-based framework for building AI agents and orchestrating automated development tasks. It provides a flexible architecture for integrating multiple LLM providers and specialized agents to automate code refactoring, architecture improvements, and development workflows.

## 🚀 Features

- **Multi-Provider LLM Support**: OpenAI, Google Gemini, Jules AI
- **Specialized AI Agents**: Code Architect, Scraper Engineer, Auto Updater
- **Task Orchestration**: JSON-based task definition and execution
- **Comprehensive Logging**: Structured logging with file persistence
- **Metrics & Analytics**: Track task performance and success rates
- **Configuration Validation**: Robust validation for configs and environment
- **CLI Interface**: User-friendly command-line interface
- **Extensible Architecture**: Easy to add new providers and agents

## 📋 Prerequisites

- Node.js 20.14.0 or higher
- TypeScript 5.8+
- API keys for your chosen LLM providers

## 🛠️ Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/devalexanderdaza/smith.git
   cd smith
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Initialize project structure:**

   ```bash
   npm run smith init
   ```

## ⚙️ Configuration

### Agent Configuration (`config/agent.config.jsonc`)

```jsonc
{
 "defaultEngine": "openai",
 "providers": {
  "openai": {
   "apiKeyEnv": "OPENAI_API_KEY",
   "model": "gpt-4o",
   "endpoint": "https://api.openai.com/v1/chat/completions",
  },
  "gemini": {
   "apiKeyEnv": "GEMINI_API_KEY",
   "model": "gemini-1.5-pro",
   "endpoint": "https://generativelanguage.googleapis.com/v1beta/models",
  },
 },
 "agents": {
  "codeArchitect": {
   "enabled": true,
   "promptFile": "agents/code-architect/prompt.md",
   "engine": "openai",
  },
 },
}
```

### Task Definition (`tasks/task-001.jsonc`)

```jsonc
{
 "agent": "codeArchitect",
 "objective": "Refactor code to follow SOLID principles",
 "sourceFile": "src/legacy-code.ts",
 "outputFile": "src/refactored-code.ts",
 "constraints": [
  "Maintain existing functionality",
  "Use TypeScript strict mode",
  "Add comprehensive JSDoc comments",
 ],
 "context": "Legacy codebase needs modernization",
}
```

## 🎯 Usage

### CLI Commands

#### Run a Task

```bash
# Execute default task
pnpm smith run -p /path/to/project

# Execute specific task with verbose logging
pnpm smith run -p /path/to/project -t tasks/custom-task.jsonc -v

# Debug mode
pnpm smith run -p /path/to/project --debug
```

You can also set the `SMITH_TASK_PATH` environment variable to point to a custom
task file. If defined, the orchestrator will use this path instead of the
default `src/tasks/task-001.jsonc`.

#### View Metrics

```bash
# Quick metrics overview
pnpm smith metrics

# Detailed report
pnpm smith metrics --report

# Metrics for specific date
pnpm smith metrics --date 2025-06-10
```

#### Validate Configuration

```bash
# Validate default config
pnpm smith validate

# Validate specific config file
pnpm smith validate -c config/custom-config.jsonc
```

#### Initialize New Project

```bash
# Initialize in current directory
pnpm smith init

# Initialize in specific directory
pnpm smith init -d /path/to/new/project
```

### Programmatic Usage

```typescript
import { getLLMProvider } from './src/providers/llm-dispatcher';
import { logger } from './src/utils/logger';

// Initialize provider
const provider = getLLMProvider('openai', {
 apiKeyEnv: 'OPENAI_API_KEY',
 model: 'gpt-4o',
 endpoint: 'https://api.openai.com/v1/chat/completions',
});

// Generate response
const response = await provider.generateResponse('Your prompt here');
logger.info('Response generated', { length: response.length });
```

## 🤖 Available Agents

### Code Architect

- **Purpose**: Refactor code following best practices and design patterns
- **Specialties**: SOLID principles, design patterns, architecture improvements
- **Configuration**: `agents/code-architect/prompt.md`

### Scraper Engineer _(Coming Soon)_

- **Purpose**: Build and optimize web scraping solutions
- **Specialties**: Multi-engine support, error handling, data extraction

### Auto Updater _(Coming Soon)_

- **Purpose**: Automated dependency updates and migrations
- **Specialties**: Package updates, breaking change handling, testing

## 📊 Monitoring & Analytics

Smith includes comprehensive monitoring capabilities:

- **Task Metrics**: Success rates, execution times, token usage
- **System Health**: Environment validation, configuration checks
- **Performance Analytics**: Provider comparison, agent effectiveness
- **Audit Logs**: Detailed execution logs with context

### Metrics Dashboard

```bash
# View system overview
pnpm smith metrics

# Example output:
📊 Smith Framework Metrics:
Total Tasks: 45
Success Rate: 95.56%
Average Duration: 12.34s
Total Tokens: 1,234,567
```

## 🔧 Development

### Project Structure

```plaintext
smith/
├── agents/                 # AI agent definitions
│   ├── code-architect/    # Code architecture agent
│   ├── scraper-engineer/  # Web scraping agent
│   └── auto-updater/      # Dependency update agent
├── config/                # Configuration files
├── orchestrator/          # Main orchestration logic
├── schemas/               # JSON schemas for validation
├── src/
│   ├── cli/              # Command-line interface
│   ├── providers/        # LLM provider implementations
│   └── utils/            # Utilities (logging, metrics, validation)
├── tasks/                # Task definitions
└── logs/                 # Application logs and metrics
```

### Adding a New LLM Provider

1. **Create provider class:**

   ```typescript
   // src/providers/my-provider.ts
   export class MyProvider implements LLMProvider {
    constructor(config: ProviderConfig) {
     // Initialize provider
    }

    async generateResponse(prompt: string): Promise<string> {
     // Implementation
    }
   }
   ```

2. **Register in dispatcher:**

   ```typescript
   // src/providers/llm-dispatcher.ts
   const providersMap = {
    // ...existing providers
    myprovider: (config: ProviderConfig) => new MyProvider(config),
   };
   ```

3. **Add to configuration:**

   ```jsonc
   // config/agent.config.jsonc
   {
    "providers": {
     "myprovider": {
      "apiKeyEnv": "MY_PROVIDER_API_KEY",
      "model": "my-model-name",
      "endpoint": "https://api.myprovider.com/v1/generate",
     },
    },
   }
   ```

### Adding a New Agent

1. **Create agent directory and prompt:**

   ```bash
   mkdir -p agents/my-agent
   echo "# My Agent Prompt Template" > agents/my-agent/prompt.md
   ```

2. **Add to configuration:**

   ```jsonc
   // config/agent.config.jsonc
   {
    "agents": {
     "myAgent": {
      "enabled": true,
      "promptFile": "agents/my-agent/prompt.md",
      "engine": "openai",
     },
    },
   }
   ```

3. **Update task schema:**

   ```json
   // src/schemas/task.schema.json
   {
    "properties": {
     "agent": {
      "enum": ["codeArchitect", "scraperEngineer", "autoUpdater", "myAgent"]
     }
    }
   }
   ```

## 🧪 Testing

```bash
# Run linting
pnpm lint

# Format code
pnpm format

# Validate configuration
pnpm smith validate

# Test with sample task
pnpm smith run -p . -t src/tasks/task-example.jsonc --debug
```

## 📈 Performance Optimization

### Best Practices

1. **Token Management**: Monitor token usage through metrics
2. **Caching**: Implement response caching for repeated prompts
3. **Batch Processing**: Group similar tasks for efficiency
4. **Error Handling**: Use comprehensive error tracking
5. **Resource Monitoring**: Track memory and CPU usage

### Scaling Considerations

- **Horizontal Scaling**: Deploy multiple Smith instances
- **Load Balancing**: Distribute tasks across providers
- **Queue Management**: Implement task queuing for high loads
- **Rate Limiting**: Respect provider API limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Add comprehensive JSDoc comments
- Include error handling and logging
- Write tests for new features
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/smith/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/smith/discussions)
- **Documentation**: [Wiki](https://github.com/your-repo/smith/wiki)

## 🔮 Roadmap

- [ ] **v1.1**: Enhanced agent capabilities
- [ ] **v1.2**: Web UI dashboard
- [ ] **v1.3**: Plugin ecosystem
- [ ] **v1.4**: Cloud deployment options
- [ ] **v1.5**: Multi-language support

---

**Smith** - Empowering developers with AI-driven automation tools.

_Built with ❤️ by [Alexander Daza](https://github.com/devalexanderdaza)_
