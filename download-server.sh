#!/bin/bash

# AORATA - Download Minecraft Server JAR Helper
# This script helps you download the official Minecraft server JAR

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  AORATA - Minecraft Server JAR Downloader                     ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if user provided a path
if [ -z "$1" ]; then
    echo "Usage: bash download-server.sh /path/to/aorata"
    echo "Example: bash download-server.sh ~/projects/Aorata"
    echo ""
    exit 1
fi

AORATA_PATH="$1"

# Verify path exists
if [ ! -d "$AORATA_PATH" ]; then
    echo "Error: Directory not found: $AORATA_PATH"
    exit 1
fi

echo "Downloading Minecraft Server 1.20.1..."
echo "Target: $AORATA_PATH"
echo ""

# Create a temporary download location
DOWNLOAD_DIR="/tmp/minecraft_server_download"
mkdir -p "$DOWNLOAD_DIR"
cd "$DOWNLOAD_DIR"

# Try multiple download methods
echo "Attempting download (Method 1: Mojang Official)..."
curl -L -o "server.jar" "https://launcher.mojang.com/v1/objects/125e5adf40c659fd3bfb54b87a4ab8e2/server.jar" 2>/dev/null

if [ -f "server.jar" ] && [ $(stat -f%z "server.jar" 2>/dev/null || stat -c%s "server.jar") -gt 1000000 ]; then
    echo "✓ Download successful!"
    echo ""
    echo "Now you need to place server.jar in your server directories:"
    echo ""
    echo "Copy to:"
    echo "  1. $AORATA_PATH/servers/server1/"
    echo "  2. $AORATA_PATH/servers/server2/"
    echo "  3. $AORATA_PATH/servers/server3/"
    echo ""
    echo "Run these commands:"
    echo ""
    echo "cp $DOWNLOAD_DIR/server.jar $AORATA_PATH/servers/server1/"
    echo "cp $DOWNLOAD_DIR/server.jar $AORATA_PATH/servers/server2/"
    echo "cp $DOWNLOAD_DIR/server.jar $AORATA_PATH/servers/server3/"
    echo ""
    echo "Then restart your server:"
    echo "cd $AORATA_PATH && npm start"
    echo ""
else
    echo "✗ Download failed from Mojang"
    echo ""
    echo "Manual download options:"
    echo ""
    echo "Option 1: Use Mojang Launcher"
    echo "  1. Visit: https://launcher.mojang.com/"
    echo "  2. Download 'server.jar' for version 1.20.1"
    echo "  3. Copy to your server directories"
    echo ""
    echo "Option 2: Direct Download Link"
    echo "  Download from: https://launcher.mojang.com/v1/objects/125e5adf40c659fd3bfb54b87a4ab8e2/server.jar"
    echo ""
    echo "Option 3: Alternative Mirror (if Mojang link fails)"
    echo "  Website: https://getbukkit.org/"
    echo "  Get: CraftBukkit or Paper for 1.20.1"
    echo ""
fi
