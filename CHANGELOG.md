# Changelog

All notable changes to the "Binance Balance Monitor" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-09-14

### Added
- Real-time Binance account balance display in VSCode status bar
- WebSocket connection for live balance updates
- Multiple currency display options (USDT, BTC, ETH, BNB)
- Configurable refresh intervals
- Status bar icon toggle option
- Command palette integration for balance management
- Secure API key configuration through VSCode settings

### Technical
- Built with TypeScript and Vite
- Uses pnpm for package management
- WebSocket integration for real-time updates
- Axios for REST API communication

### Security
- API keys stored securely in VSCode configuration
- No credentials logged or exposed