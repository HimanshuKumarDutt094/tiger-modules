#!/bin/bash

# TigerModule Autolink Plugin Publishing Script

set -e

echo "🚀 Publishing TigerModule Autolink Gradle Plugin"

# Check if API keys are set
if [ -z "$GRADLE_PUBLISH_KEY" ] || [ -z "$GRADLE_PUBLISH_SECRET" ]; then
    echo "❌ Error: GRADLE_PUBLISH_KEY and GRADLE_PUBLISH_SECRET environment variables must be set"
    echo "   Get your keys from: https://plugins.gradle.org/user/apiKeys"
    echo "   Then run: export GRADLE_PUBLISH_KEY=your-key && export GRADLE_PUBLISH_SECRET=your-secret"
    exit 1
fi

echo "✅ API keys found"

# Validate plugin configuration
echo "🔍 Validating plugin configuration..."
./gradlew validatePlugins

echo "✅ Plugin validation passed"

# Check required metadata
echo "🔍 Checking required metadata..."
if ! grep -q "website.*github.com" build.gradle.kts; then
    echo "❌ Error: website must be set in gradlePlugin block"
    exit 1
fi

if ! grep -q "vcsUrl.*github.com" build.gradle.kts; then
    echo "❌ Error: vcsUrl must be set in gradlePlugin block"
    exit 1
fi

if ! grep -q "displayName" build.gradle.kts; then
    echo "❌ Error: displayName must be set for each plugin"
    exit 1
fi

if ! grep -q "description" build.gradle.kts; then
    echo "❌ Error: description must be set for each plugin"
    exit 1
fi

echo "✅ Required metadata found"

# Build and test
echo "🔨 Building plugin..."
./gradlew build

echo "✅ Build successful"

# Publish to Plugin Portal
echo "📦 Publishing to Gradle Plugin Portal..."
./gradlew publishPlugins

echo "🎉 Plugin published successfully!"
echo ""
echo "Your plugins are now available at:"
echo "  - https://plugins.gradle.org/plugin/io.github.himanshukumardutt094.extension-settings"
echo "  - https://plugins.gradle.org/plugin/io.github.himanshukumardutt094.extension-build"
echo ""
echo "It may take a few minutes for the plugins to appear in search results."