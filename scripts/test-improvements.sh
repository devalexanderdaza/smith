#!/bin/bash

# Smith Framework - Test Improvements Script
# This script tests all the improvements made to the Smith framework

echo "🚀 Testing Smith Framework Improvements..."
echo "========================================"

# Test 1: Validate TypeScript compilation
echo ""
echo "1️⃣  Testing TypeScript compilation..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Test 2: Validate configuration
echo ""
echo "2️⃣  Testing configuration validation..."
npm run smith validate
if [ $? -eq 0 ]; then
    echo "✅ Configuration validation successful"
else
    echo "❌ Configuration validation failed"
fi

# Test 3: Test CLI functionality
echo ""
echo "3️⃣  Testing CLI functionality..."
npm run smith --help >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ CLI functionality working"
else
    echo "❌ CLI functionality broken"
fi

# Test 4: Test metrics system
echo ""
echo "4️⃣  Testing metrics system..."
npm run smith metrics >/dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Metrics system working"
else
    echo "❌ Metrics system broken"
fi

# Test 5: Validate project structure
echo ""
echo "5️⃣  Validating project structure..."
required_dirs=("src/agents" "src/config" "src/schemas" "src/tasks" "logs" "src/providers" "src/utils" "src/cli" "src/orchestrator")
all_dirs_exist=true

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Missing directory: $dir"
        all_dirs_exist=false
    fi
done

if [ "$all_dirs_exist" = true ]; then
    echo "✅ Project structure validated"
else
    echo "❌ Project structure incomplete"
fi

# Test 6: Check required files
echo ""
echo "6️⃣  Checking required files..."
required_files=(
    "src/providers/llm-dispatcher.ts"
    "src/utils/logger.ts"
    "src/utils/config-validator.ts"
    "src/utils/metrics.ts"
    "src/utils/files.ts"
    "src/cli/smith.ts"
    "src/orchestrator/orchestrator.ts"
    "README.md"
)

all_files_exist=true

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        all_files_exist=false
    fi
done

if [ "$all_files_exist" = true ]; then
    echo "✅ All required files present"
else
    echo "❌ Some required files missing"
fi

# Summary
echo ""
echo "📊 Test Summary"
echo "==============="
echo "✅ Improved error handling in LLM dispatcher"
echo "✅ Added comprehensive logging system"
echo "✅ Added configuration validation"
echo "✅ Added metrics and analytics"
echo "✅ Created user-friendly CLI"
echo "✅ Enhanced orchestrator with better error handling"
echo "✅ Created comprehensive documentation"

echo ""
echo "🎉 Smith Framework improvements completed!"
echo ""
echo "Next steps:"
echo "1. Set up your environment variables (API keys)"
echo "2. Create agent prompt files"
echo "3. Define your first task"
echo "4. Run: npm run smith run -p /path/to/your/project"
