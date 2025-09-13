# Binance Balance Monitor

VSCode extension to display real-time Binance account balance in the status bar.

## Features

- 🔄 Real-time balance updates in VSCode status bar
- 💰 Support for multiple display currencies (USDT, BTC, ETH, BNB)
- ⚙️ Configurable refresh intervals
- 📊 Detailed balance view for all assets
- 🔒 Secure API key storage

## Installation

1. Open VSCode
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Binance Balance Monitor"
4. Click Install

## Troubleshooting

### Extension not showing in Output panel

If the "Binance Balance Monitor" output channel is not appearing in VS Code's Output panel:

1. **Check Extension Installation**
   ```bash
   code --list-extensions | grep binance
   ```

2. **Common Issue: node-fetch dependency**
   - The extension originally used `node-fetch` which can cause loading issues in VS Code
   - **Fixed in v1.0.2**: Replaced with `axios` for better compatibility

3. **Reinstallation Steps**
   ```bash
   # Uninstall current version
   code --uninstall-extension binance-balance.binance-balance-vscode

   # Recompile and package (in extension directory)
   npm install
   npm run compile
   npx vsce package --out binance-balance-vscode-1.0.0.vsix

   # Install updated version
   code --install-extension binance-balance-vscode-1.0.0.vsix
   ```

4. **Reload VS Code**
   - Command Palette → "Developer: Reload Window"
   - Or completely restart VS Code

5. **Verify Extension Activation**
   - Extension activates on `onStartupFinished`
   - Check Output panel → "Binance Balance Monitor" should appear
   - Look for "Extension activated!" message

### Common Issues Fixed
- **v1.0.4**: Added webpack bundling to include dependencies (axios) in extension package
- **v1.0.3**: Changed activationEvents to "*" for immediate activation
- **v1.0.2**: Replaced node-fetch with axios for better VS Code compatibility
- **v1.0.1**: Fixed TypeScript compilation issues
- **v1.0.0**: Initial release

### Dependencies Issue Solution
VS Code extensions require dependencies to be bundled. The extension now uses webpack to bundle all dependencies including axios into a single file.

## Setup

1. Get your Binance API credentials:
   - Log in to [Binance](https://binance.com)
   - Go to API Management
   - Create a new API key
   - **Important**: Only enable "Enable Reading" permission for security

2. Configure the extension:
   - Open Command Palette (Ctrl+Shift+P)
   - Run "Binance: Configure Binance API"
   - Enter your API Key and Secret

## Commands

- `Binance: Configure Binance API` - Set up API credentials
- `Binance: Refresh Binance Balance` - Manually refresh balance
- `Binance: Show Detailed Balances` - View all asset balances

## Settings

- `binanceBalance.apiKey` - Your Binance API key
- `binanceBalance.apiSecret` - Your Binance API secret
- `binanceBalance.refreshInterval` - Refresh interval in milliseconds (default: 10000)
- `binanceBalance.displayCurrency` - Currency to display balance in (USDT, BTC, ETH, BNB)

## Security

- API credentials are stored securely in VSCode settings
- Only "Enable Reading" permission is required
- No trading permissions needed

## Status Bar Display

The extension displays your balance in the VSCode status bar with these states:

- 💰 $1,234.56 - Current balance
- 🔄 Loading... - Fetching balance
- ⚠️ Configure API - API not configured
- ❌ Error - API error occurred

Click on the status bar item to manually refresh the balance.

## Requirements

- VSCode 1.74.0 or higher
- Binance account with API access
- Internet connection

## Development

### Building

```bash
# Install dependencies
pnpm install

# Build for development
pnpm run compile

# Build for production
pnpm run package

# Watch mode
pnpm run watch
```

### Packaging

```bash
# Package extension
pnpm run vscode:package

# Publish to marketplace (requires VSCE_PAT token)
pnpm run vscode:publish
```

### GitHub Actions

This project includes automated release workflows:

1. **Release Workflow** (`.github/workflows/release.yml`)
   - Triggers on version tags (`v*`) or manual workflow dispatch
   - Builds and packages the extension
   - Creates GitHub releases with VSIX files
   - Publishes to VS Code Marketplace and Open VSX Registry

2. **Version Bump Workflow** (`.github/workflows/version-bump.yml`)
   - Manual workflow to bump version (patch/minor/major)
   - Creates git tags and commits
   - Generates changelog PR

#### Setting up releases:

1. **Manual Release**:
   - Go to Actions → "Version Bump"
   - Select bump type (patch/minor/major)
   - Run workflow

2. **Secrets needed for marketplace publishing**:
   - `VSCE_PAT`: Visual Studio Code marketplace token
   - `OVSX_PAT`: Open VSX Registry token (optional)

## License

MIT

## Disclaimer

This extension is not affiliated with Binance. Use at your own risk. Always ensure you're using read-only API keys with minimal permissions.
