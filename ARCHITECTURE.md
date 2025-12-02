# Architecture

## Core Components

### Extension Lifecycle

**[src/extension.ts](src/extension.ts)**

- Entry point with `activate()` and `deactivate()` functions
- Registers three commands: `binanceBalance.refresh`, `binanceBalance.configure`, `binanceBalance.showBalances`
- Creates and manages `BinanceApiClient` and `BalanceStatusBar` instances
- Includes detailed logging to Output channel for debugging

### API Client

**[src/binanceApi.ts](src/binanceApi.ts)**

- `BinanceApiClient` class handles all Binance REST API and WebSocket interactions
- Supports three account types:
  - Spot (`/api/v3/account`)
  - Cross Margin (`/sapi/v1/margin/account`)
  - Isolated Margin (`/sapi/v1/margin/isolated/account`)
- WebSocket connection (`wss://stream.binance.com:9443/ws/`) for real-time price updates
- Price caching mechanism to minimize API calls
- Silent background updates using cached prices when WebSocket receives new data
- HMAC-SHA256 signature generation for authenticated requests

### Status Bar

**[src/statusBar.ts](src/statusBar.ts)**

- `BalanceStatusBar` class manages VSCode status bar item
- Displays total estimated balance in USDT, BTC, ETH, or BNB
- Shows breakdown of Spot, Cross Margin, and Isolated Margin in tooltip
- Distinguishes between manual refreshes and silent WebSocket updates
- Configurable refresh intervals and display options

## Data Flow

### 1. Initial Load

```
Extension activates
  → StatusBar starts
  → API client fetches all account balances
  → Total estimated balance calculated
  → Status bar updated
```

### 2. WebSocket Updates (Silent)

```
Price ticker arrives
  → Price cache updated
  → Silent balance recalculation (using cache)
  → Status bar updated quietly
```

### 3. Manual Refresh

```
User clicks status bar
  → Full API fetch (bypasses cache)
  → Balance recalculated
  → Status bar updated
```

## Configuration

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
