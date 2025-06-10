#!/bin/bash

# Smith Framework - Quick Setup Script
# This script helps you get started with Smith quickly

echo "🚀 Smith Framework - Quick Setup"
echo "================================"

# Step 1: Environment Variables
echo ""
echo "1️⃣  Setting up environment variables..."
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
    echo "⚠️  Please edit .env and add your API keys:"
    echo "   - OPENAI_API_KEY"
    echo "   - GEMINI_API_KEY"
    echo "   - JULES_API_KEY"
else
    echo "✅ .env file already exists"
fi

# Step 2: Install Dependencies
echo ""
echo "2️⃣  Installing dependencies..."
if command -v pnpm &>/dev/null; then
    pnpm install
elif command -v npm &>/dev/null; then
    npm install
else
    echo "❌ No package manager found. Please install npm or pnpm."
    exit 1
fi

# Step 3: Build Project
echo ""
echo "3️⃣  Building project..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Step 4: Validate Configuration
echo ""
echo "4️⃣  Validating configuration..."
npm run smith validate
if [ $? -eq 0 ]; then
    echo "✅ Configuration valid"
else
    echo "⚠️  Configuration has warnings (probably missing API keys)"
fi

# Step 5: Show Next Steps
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Available Commands:"
echo "  npm run smith run -p /path/to/project    # Execute a task"
echo "  npm run smith metrics                    # View metrics"
echo "  npm run smith validate                   # Validate config"
echo "  npm run smith init -d /new/project       # Initialize new project"
echo ""
echo "Available Tasks:"
echo "  src/tasks/task-001.jsonc        # Code architecture task"
echo "  src/tasks/scraper-task.jsonc    # Web scraping task"
echo "  src/tasks/update-task.jsonc     # Dependency update task"
echo "  src/tasks/architecture-task.jsonc # Advanced architecture task"
echo ""
echo "Available Agents:"
echo "  codeArchitect    # Code refactoring and architecture"
echo "  scraperEngineer  # Web scraping solutions"
echo "  autoUpdater      # Dependency management"
echo ""
echo "Next Steps:"
echo "1. Add your API keys to .env file"
echo "2. Choose a task from src/tasks/ or create your own"
echo "3. Run: npm run smith run -p /path/to/your/project"
echo ""
echo "📚 Documentation: README.md"
echo "🐛 Issues: Check logs/ directory for debugging"
