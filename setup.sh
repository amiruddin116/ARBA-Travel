#!/bin/bash
set -e

echo ""
echo "=== ARBA Travel — Warehouse Setup ==="
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
  echo "ERROR: Node.js is not installed."
  echo "Install it from https://nodejs.org (version 18 or higher), then run this script again."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "ERROR: Node.js v18+ required. You have $(node -v)."
  echo "Upgrade at https://nodejs.org then run this script again."
  exit 1
fi
echo "✓ Node.js $(node -v) detected"

# 2. Install Claude Code CLI if missing
if ! command -v claude &> /dev/null; then
  echo "→ Installing Claude Code CLI..."
  npm install -g @anthropic-ai/claude-code
  echo "✓ Claude Code installed"
else
  echo "✓ Claude Code already installed ($(claude --version 2>/dev/null || echo 'version unknown'))"
fi

# 3. Create .mcp.json with warehouse credentials
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MCP_FILE="$SCRIPT_DIR/.mcp.json"

if [ ! -f "$MCP_FILE" ]; then
  echo "→ Creating .mcp.json with warehouse credentials..."
  cat > "$MCP_FILE" <<'MCPEOF'
{
  "mcpServers": {
    "arba-warehouse": {
      "command": "npx",
      "args": ["-y", "@benborla29/mcp-server-mysql"],
      "env": {
        "MYSQL_HOST": "crm.arbatravel.com",
        "MYSQL_PORT": "3306",
        "MYSQL_DATABASE": "attcrm",
        "MYSQL_USER": "arbatravel",
        "MYSQL_PASSWORD": "Halaltourism2015"
      }
    }
  }
}
MCPEOF
  echo "✓ .mcp.json created"
else
  echo "✓ .mcp.json already exists"
fi

# 4. Done
echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Make sure WireGuard VPN is connected"
echo "  2. Run:  claude"
echo "  3. Ask:  'List all tables in the ARBA warehouse'"
echo ""
