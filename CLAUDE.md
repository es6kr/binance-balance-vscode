# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode extension that displays real-time Binance account balance in the status bar, supporting spot, cross margin, and isolated margin accounts.

## Build and Development Commands

### Development

```bash
# Install dependencies (uses pnpm via corepack)
pnpm install

# Development mode with watch
pnpm run dev
# or
pnpm run watch

# Compile for development
pnpm run compile
```

### Testing the Extension

```bash
# Package the extension locally
pnpm run vscode:package

# Install the packaged extension
code --install-extension binance-balance-vscode-0.0.5.vsix

# Uninstall (useful for testing fresh installs)
code --uninstall-extension binance-balance.binance-balance-vscode
```

### Release

```bash
# Build for production
pnpm run package

# Package and publish (requires VSCE_PAT token)
pnpm run vscode:publish
```

## Architecture

### Core Components

**Extension Lifecycle** (`src/extension.ts`)

- Entry point with `activate()` and `deactivate()` functions
- Registers three commands: `binanceBalance.refresh`, `binanceBalance.configure`, `binanceBalance.showBalances`
- Creates and manages `BinanceApiClient` and `BalanceStatusBar` instances
- Includes detailed logging to Output channel for debugging

**API Client** (`src/binanceApi.ts`)

- `BinanceApiClient` class handles all Binance REST API and WebSocket interactions
- Supports three account types: Spot (`/api/v3/account`), Cross Margin (`/sapi/v1/margin/account`), Isolated Margin (`/sapi/v1/margin/isolated/account`)
- WebSocket connection (`wss://stream.binance.com:9443/ws/`) for real-time price updates
- Price caching mechanism to minimize API calls
- Silent background updates using cached prices when WebSocket receives new data
- HMAC-SHA256 signature generation for authenticated requests

**Status Bar** (`src/statusBar.ts`)

- `BalanceStatusBar` class manages VSCode status bar item
- Displays total estimated balance in USDT, BTC, ETH, or BNB
- Shows breakdown of Spot, Cross Margin, and Isolated Margin in tooltip
- Distinguishes between manual refreshes and silent WebSocket updates
- Configurable refresh intervals and display options

### Data Flow

1. **Initial Load**: Extension activates → StatusBar starts → API client fetches all account balances → Total estimated balance calculated → Status bar updated
2. **WebSocket Updates**: Price ticker arrives → Price cache updated → Silent balance recalculation (using cache) → Status bar updated quietly
3. **Manual Refresh**: User clicks status bar → Full API fetch (bypasses cache) → Balance recalculated → Status bar updated

### Configuration

Settings are stored in VSCode workspace configuration (`binanceBalance.*`):

- `apiKey`, `apiSecret`: Binance API credentials (read-only permissions required)
- `refreshInterval`: Manual refresh interval in ms (default: 10000)
- `silentRefreshInterval`: Background update throttle in ms (default: 5000)
- `displayCurrency`: Display currency (USDT/BTC/ETH/BNB)
- `showIcon`: Whether to show 💰 emoji

## Build System

Uses **Vite** for bundling (not webpack):

- `vite.config.ts` configures library mode with CommonJS output
- Bundles dependencies (axios, ws) into single `out/extension.js`
- Externalizes VSCode API and Node.js built-ins
- Source maps enabled for debugging

## Code Style

Follows CONTRIBUTING.md guidelines:

- **4 spaces** for TypeScript indentation
- **English JSDoc** comments required for all public APIs
- Use `pnpm run format` before committing (Prettier configuration in `.prettierrc`)
- Git hooks via Husky ensure formatting on commit

## CI/CD

GitHub Actions workflows:

- **release.yml**: Triggers on `v*` tags, builds extension, creates GitHub release, publishes to VS Code Marketplace and Open VSX Registry
- **version-bump.yml**: Manual workflow to bump version and create tags
- **build.yml**: CI build validation

Required secrets for publishing:

- `VSCE_PAT`: Visual Studio Marketplace token
- `OVSX_PAT`: Open VSX Registry token (optional)

## Common Issues

### Extension Not Loading

- Check Output panel → "Binance Balance Monitor" for activation logs
- Extension activates on `onStartupFinished` event
- Dependencies are bundled, no external installs required in VSCode

### API Errors

- Ensure API key has "Enable Reading" permission only
- Check API credentials in VSCode settings (`binanceBalance.apiKey`, `binanceBalance.apiSecret`)
- View detailed error logs in Output panel

### WebSocket Connection

- WebSocket automatically reconnects on disconnect (5s delay)
- Subscribes to major crypto tickers: BTC, ETH, BNB, ADA, XRP, SOL, DOT, LINK
- Price cache persists across reconnections
