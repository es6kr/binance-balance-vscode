# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode extension that displays real-time Binance account balance in the status bar, supporting spot, cross margin, and isolated margin accounts.

## Documentation

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Complete development guide (building, testing, publishing)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed component architecture and data flow
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## Quick Reference

### Build Commands

```bash
# Install dependencies (uses pnpm via corepack)
pnpm install

# Development mode with watch
pnpm run dev

# Compile for development
pnpm run compile

# Build for production
pnpm run package

# Package the extension locally
pnpm run vscode:package
```

### Code Style Rules

Follow CONTRIBUTING.md guidelines:

- **4 spaces** for TypeScript indentation (not 2 spaces, not tabs)
- **English JSDoc** comments required for all public APIs
- Use `pnpm run format` before committing (Prettier configuration in `.prettierrc`)
- Git hooks via Husky ensure formatting on commit

### Important Development Notes

1. **Build System**: Uses **Vite** (not webpack) - see `vite.config.ts`
2. **Dependencies**: axios and ws are bundled into `out/extension.js`
3. **API Integration**: All Binance API calls use HMAC-SHA256 signatures
4. **WebSocket**: Automatic reconnection with 5s delay on disconnect

### Common Task Guidelines

When modifying code:

- Check [ARCHITECTURE.md](ARCHITECTURE.md) first to understand component relationships
- Maintain the existing pattern of logging to Output channel for debugging
- Keep price caching logic intact to minimize API calls
- Preserve WebSocket reconnection behavior

When adding features:

- Follow the command registration pattern in `src/extension.ts`
- Use the existing `BinanceApiClient` methods rather than direct API calls
- Update status bar through `BalanceStatusBar` class methods
- Add new settings to `package.json` configuration schema

### Testing

```bash
# Package and install locally
pnpm run vscode:package
code --install-extension binance-balance-vscode-0.0.5.vsix

# Uninstall
code --uninstall-extension binance-balance.binance-balance-vscode
```

Check Output panel → "Binance Balance Monitor" for logs.
