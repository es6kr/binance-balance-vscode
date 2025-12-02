# Development Guide

This guide covers everything you need to know to develop, build, and publish the Binance Balance Monitor extension.

## Prerequisites

- Node.js 18+ (uses corepack for pnpm)
- VSCode 1.74.0 or higher
- Git

## Getting Started

```bash
# Clone the repository
git clone <repository-url>
cd binance-balance-vscode

# Install dependencies (uses pnpm via corepack)
pnpm install
```

## Building

### Development Build

```bash
# Compile TypeScript
pnpm run compile

# Development mode with watch (auto-recompile on changes)
pnpm run dev
# or
pnpm run watch
```

### Production Build

```bash
# Build optimized bundle
pnpm run package
```

## Testing Locally

### Install Extension Locally

```bash
# Package the extension
pnpm run vscode:package

# Install the packaged .vsix file
code --install-extension binance-balance-vscode-0.1.0.vsix

# Reload VSCode window
# Command Palette → "Developer: Reload Window"
```

### Uninstall Extension

```bash
code --uninstall-extension binance-balance.binance-balance-vscode
```

### Debugging

1. Open the project in VSCode
2. Press F5 to launch Extension Development Host
3. Check Output panel → "Binance Balance Monitor" for logs
4. Extension activates on `onStartupFinished` event

## Build System

### Vite Configuration

This project uses **Vite** (not webpack) for bundling:

- Configuration: [vite.config.ts](vite.config.ts)
- Output: `out/extension.js` (CommonJS format)
- Bundled dependencies: axios, ws
- Externalized: vscode API, Node.js built-ins
- Source maps: Enabled for debugging

### Why Vite?

- Faster builds than webpack
- Simpler configuration
- Better tree-shaking
- Modern tooling

## Code Style

### Rules

Follow the guidelines in [CONTRIBUTING.md](CONTRIBUTING.md):

- **4 spaces** for TypeScript indentation (not 2 spaces, not tabs)
- **English JSDoc** comments required for all public APIs
- **Prettier** for code formatting
- **ESLint** for linting (if configured)

### Formatting

```bash
# Format code with Prettier
pnpm run format

# Git hooks (via Husky) automatically format on commit
```

### Important Style Notes

- Use async/await instead of .then() chains
- Use const/let, never var
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Add JSDoc comments to all exported functions/classes

## Project Structure

```
binance-balance-vscode/
├── src/
│   ├── extension.ts       # Extension entry point
│   ├── binanceApi.ts      # Binance API client
│   └── statusBar.ts       # Status bar management
├── out/                   # Compiled output
├── .github/workflows/     # CI/CD workflows
├── vite.config.ts        # Build configuration
├── package.json          # Extension manifest
└── tsconfig.json         # TypeScript configuration
```

For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Publishing

### Package Extension

```bash
# Create .vsix file
pnpm run vscode:package
```

### Publish to Marketplace

```bash
# Requires VSCE_PAT environment variable
pnpm run vscode:publish
```

Or use GitHub Actions (recommended).

## CI/CD with GitHub Actions

### Workflows

1. **[Release Workflow](.github/workflows/release.yml)**
   - Triggers: Version tags (`v*`) or manual dispatch
   - Actions:
     - Builds and packages extension
     - Creates GitHub release with .vsix file
     - Publishes to VS Code Marketplace
     - Publishes to Open VSX Registry

2. **[Version Bump Workflow](.github/workflows/version-bump.yml)**
   - Triggers: Manual dispatch
   - Actions:
     - Bumps version (patch/minor/major)
     - Creates git tag and commit
     - Generates changelog PR

3. **[Build Workflow](.github/workflows/build.yml)**
   - Triggers: Pull requests, push to main
   - Actions:
     - CI validation
     - Runs build and tests

### Release Process

#### Option 1: Automated (Recommended)

1. Go to Actions → "Version Bump"
2. Select bump type:
   - **patch**: Bug fixes (0.1.0 → 0.1.1)
   - **minor**: New features (0.1.0 → 0.2.0)
   - **major**: Breaking changes (0.1.0 → 1.0.0)
3. Run workflow
4. Workflow creates tag and triggers release

#### Option 2: Manual

```bash
# Bump version in package.json
npm version patch|minor|major

# Push tag
git push --tags

# GitHub Actions will automatically build and publish
```

### Required Secrets

Configure in GitHub repository settings:

- `VSCE_PAT`: [Visual Studio Marketplace Personal Access Token](https://dev.azure.com/)
  - Required for publishing to VS Code Marketplace
  - Needs "Marketplace (Publish)" scope

- `OVSX_PAT`: [Open VSX Registry Access Token](https://open-vsx.org/)
  - Optional for publishing to Open VSX
  - Alternative marketplace for VSCodium, Eclipse Theia, etc.

## Common Development Tasks

### Adding a New Command

1. Register command in [src/extension.ts](src/extension.ts):
   ```typescript
   const disposable = vscode.commands.registerCommand(
       'binanceBalance.myCommand',
       async () => { /* implementation */ }
   );
   context.subscriptions.push(disposable);
   ```

2. Add command to [package.json](package.json):
   ```json
   "contributes": {
       "commands": [
           {
               "command": "binanceBalance.myCommand",
               "title": "Binance: My Command"
           }
       ]
   }
   ```

### Adding a New Setting

1. Add to [package.json](package.json) configuration:
   ```json
   "configuration": {
       "properties": {
           "binanceBalance.mySetting": {
               "type": "string",
               "default": "value",
               "description": "My setting description"
           }
       }
   }
   ```

2. Read setting in code:
   ```typescript
   const config = vscode.workspace.getConfiguration('binanceBalance');
   const value = config.get<string>('mySetting');
   ```

### Modifying API Client

See [src/binanceApi.ts](src/binanceApi.ts):
- All API calls use HMAC-SHA256 signatures
- Price caching reduces API calls
- WebSocket auto-reconnects on disconnect

### Updating Status Bar

See [src/statusBar.ts](src/statusBar.ts):
- Update via `updateBalance()` method
- Tooltip shows detailed breakdown
- Configurable display currency

## Troubleshooting

### Extension Not Loading

1. Check Output panel → "Binance Balance Monitor"
2. Look for "Extension activated!" message
3. Verify dependencies are bundled in `out/extension.js`

### Build Errors

```bash
# Clean build
rm -rf out node_modules
pnpm install
pnpm run compile
```

### WebSocket Issues

- Check firewall/proxy settings
- WebSocket URL: `wss://stream.binance.com:9443/ws/`
- Auto-reconnect delay: 5 seconds

### API Errors

- Verify API key has "Enable Reading" permission only
- Check API credentials in VSCode settings
- View detailed errors in Output panel

## Resources

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Binance API Documentation](https://binance-docs.github.io/apidocs/)
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
