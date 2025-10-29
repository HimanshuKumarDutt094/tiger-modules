#!/bin/bash

# Script to publish tiger-annotation-processor to mavenLocal for testing

echo "📦 Publishing tiger-annotation-processor to mavenLocal..."
echo ""

./gradlew clean build publishToMavenLocal

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully published to mavenLocal!"
    echo ""
    echo "📍 Location: ~/.m2/repository/io/github/himanshukumardutt094/tiger-annotation-processor/1.0.0/"
    echo ""
    echo "To use in your project, add to settings.gradle.kts or build.gradle.kts:"
    echo ""
    echo "repositories {"
    echo "    mavenLocal()"
    echo "    mavenCentral()"
    echo "    google()"
    echo "}"
    echo ""
else
    echo ""
    echo "❌ Failed to publish"
    exit 1
fi
