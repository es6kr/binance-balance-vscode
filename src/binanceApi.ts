import * as crypto from 'crypto';
import * as vscode from 'vscode';
import axios from 'axios';
import * as WebSocket from 'ws';

export interface BalanceInfo {
    asset: string;
    free: string;
    locked: string;
}

export interface MarginBalanceInfo {
    asset: string;
    free: string;
    locked: string;
    borrowed: string;
    interest: string;
    netAsset: string;
}

export interface IsolatedMarginAsset {
    symbol: string;
    quoteAsset: {
        asset: string;
        free: string;
        locked: string;
        borrowed: string;
        interest: string;
        netAsset: string;
    };
    baseAsset: {
        asset: string;
        free: string;
        locked: string;
        borrowed: string;
        interest: string;
        netAsset: string;
    };
}

export interface TotalEstimatedBalance {
    totalUSDT: number;
    spotUSDT: number;
    marginUSDT: number;
    isolatedMarginUSDT: number;
}

export class BinanceApiClient {
    private readonly baseUrl = 'https://api.binance.com';
    private readonly wsBaseUrl = 'wss://stream.binance.com:9443/ws/';
    private apiKey: string = '';
    private apiSecret: string = '';
    private ws: WebSocket | null = null;
    private priceCache: Map<string, number> = new Map();
    private balanceCache: TotalEstimatedBalance | null = null;
    private lastUpdateTime: number = 0;
    private isInitialized: boolean = false;
    private onBalanceUpdateCallback?: (balance: TotalEstimatedBalance) => void;

    constructor() {
        this.loadConfiguration();
        this.setupPriceStream();
    }

    private loadConfiguration() {
        const config = vscode.workspace.getConfiguration('binanceBalance');
        this.apiKey = config.get<string>('apiKey', '');
        this.apiSecret = config.get<string>('apiSecret', '');
    }

    private setupPriceStream() {
        // Subscribe to price updates for major cryptocurrencies
        const symbols = [
            'btcusdt',
            'ethusdt',
            'bnbusdt',
            'adausdt',
            'xrpusdt',
            'solusdt',
            'dotusdt',
            'linkusdt',
        ];
        const streamName = symbols.map((s) => `${s}@ticker`).join('/');

        try {
            this.ws = new WebSocket(`${this.wsBaseUrl}${streamName}`);

            this.ws.on('open', () => {
                console.log('Binance WebSocket connected');
            });

            this.ws.on('message', (data: string) => {
                try {
                    const ticker = JSON.parse(data);
                    if (ticker.s && ticker.c) {
                        this.priceCache.set(ticker.s, parseFloat(ticker.c));
                        this.silentlyUpdateBalance();
                    }
                } catch (error) {
                    console.warn('WebSocket message parse error:', error);
                }
            });

            this.ws.on('error', (error) => {
                console.warn('WebSocket error:', error);
            });

            this.ws.on('close', () => {
                console.log('WebSocket disconnected, reconnecting in 5s...');
                setTimeout(() => this.setupPriceStream(), 5000);
            });
        } catch (error) {
            console.warn('Failed to setup WebSocket:', error);
        }
    }

    onBalanceUpdate(callback: (balance: TotalEstimatedBalance) => void) {
        this.onBalanceUpdateCallback = callback;
    }

    private async silentlyUpdateBalance() {
        // Get silent refresh interval from config
        const config = vscode.workspace.getConfiguration('binanceBalance');
        const silentRefreshInterval = config.get<number>('silentRefreshInterval', 5000);

        // Only update if we have initial data and enough time has passed since last update
        if (!this.isInitialized || Date.now() - this.lastUpdateTime < silentRefreshInterval) {
            return;
        }

        try {
            const newBalance = await this.getTotalEstimatedBalance(true); // true = use cache when possible
            if (this.onBalanceUpdateCallback && newBalance) {
                this.onBalanceUpdateCallback(newBalance);
            }
        } catch (error) {
            // Silently handle errors in background updates
            console.warn('Silent balance update failed:', error);
        }
    }

    private createSignature(queryString: string): string {
        return crypto.createHmac('sha256', this.apiSecret).update(queryString).digest('hex');
    }

    private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        if (!this.apiKey || !this.apiSecret) {
            throw new Error('API credentials not configured');
        }

        const timestamp = Date.now();
        const queryString = new URLSearchParams({
            ...params,
            timestamp: timestamp.toString(),
        }).toString();

        const signature = this.createSignature(queryString);
        const finalQueryString = `${queryString}&signature=${signature}`;

        const url = `${this.baseUrl}${endpoint}?${finalQueryString}`;

        const response = await axios.get(url, {
            headers: {
                'X-MBX-APIKEY': this.apiKey,
            },
        });

        if (response.status !== 200) {
            throw new Error(`Binance API error: ${response.status} - ${response.statusText}`);
        }

        return response.data;
    }

    async getAccountBalance(): Promise<BalanceInfo[]> {
        try {
            const data = await this.makeRequest('/api/v3/account');
            return data.balances.filter(
                (balance: BalanceInfo) =>
                    parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0
            );
        } catch (error) {
            console.error('Failed to fetch balance:', error);
            throw error;
        }
    }

    async getMarginAccountBalance(): Promise<MarginBalanceInfo[]> {
        try {
            const data = await this.makeRequest('/sapi/v1/margin/account');
            return data.userAssets.filter(
                (balance: MarginBalanceInfo) => parseFloat(balance.netAsset) !== 0
            );
        } catch (error) {
            console.error('Failed to fetch margin balance:', error);
            return []; // Return empty array if margin account not available
        }
    }

    async getIsolatedMarginAccountBalance(): Promise<IsolatedMarginAsset[]> {
        try {
            const data = await this.makeRequest('/sapi/v1/margin/isolated/account');
            return data.assets.filter(
                (asset: IsolatedMarginAsset) =>
                    parseFloat(asset.baseAsset.netAsset) !== 0 ||
                    parseFloat(asset.quoteAsset.netAsset) !== 0
            );
        } catch (error) {
            console.error('Failed to fetch isolated margin balance:', error);
            return []; // Return empty array if isolated margin account not available
        }
    }

    async getTotalEstimatedBalance(useCache = false): Promise<TotalEstimatedBalance> {
        try {
            // Return cached balance if using cache and data is fresh (less than 30 seconds old)
            if (useCache && this.balanceCache && Date.now() - this.lastUpdateTime < 30000) {
                return this.balanceCache;
            }

            const [spotBalances, marginBalances, isolatedMarginAssets] = await Promise.all([
                this.getAccountBalance(),
                this.getMarginAccountBalance(),
                this.getIsolatedMarginAccountBalance(),
            ]);

            let spotUSDT = 0;
            let marginUSDT = 0;
            let isolatedMarginUSDT = 0;

            // Calculate spot balance
            for (const balance of spotBalances) {
                const totalAmount = parseFloat(balance.free) + parseFloat(balance.locked);

                if (balance.asset === 'USDT') {
                    spotUSDT += totalAmount;
                } else if (totalAmount > 0) {
                    try {
                        const price = await this.getPrice(`${balance.asset}USDT`, useCache);
                        spotUSDT += totalAmount * price;
                    } catch (error) {
                        console.warn(`Failed to get price for ${balance.asset}:`, error);
                    }
                }
            }

            // Calculate cross margin balance
            for (const balance of marginBalances) {
                const netAmount = parseFloat(balance.netAsset);

                if (balance.asset === 'USDT') {
                    marginUSDT += netAmount;
                } else if (netAmount !== 0) {
                    try {
                        const price = await this.getPrice(`${balance.asset}USDT`, useCache);
                        marginUSDT += netAmount * price;
                    } catch (error) {
                        console.warn(`Failed to get price for ${balance.asset}:`, error);
                    }
                }
            }

            // Calculate isolated margin balance
            for (const asset of isolatedMarginAssets) {
                // Base asset
                const baseNetAmount = parseFloat(asset.baseAsset.netAsset);
                if (baseNetAmount !== 0) {
                    if (asset.baseAsset.asset === 'USDT') {
                        isolatedMarginUSDT += baseNetAmount;
                    } else {
                        try {
                            const price = await this.getPrice(
                                `${asset.baseAsset.asset}USDT`,
                                useCache
                            );
                            isolatedMarginUSDT += baseNetAmount * price;
                        } catch (error) {
                            console.warn(
                                `Failed to get price for ${asset.baseAsset.asset}:`,
                                error
                            );
                        }
                    }
                }

                // Quote asset
                const quoteNetAmount = parseFloat(asset.quoteAsset.netAsset);
                if (quoteNetAmount !== 0) {
                    if (asset.quoteAsset.asset === 'USDT') {
                        isolatedMarginUSDT += quoteNetAmount;
                    } else {
                        try {
                            const price = await this.getPrice(
                                `${asset.quoteAsset.asset}USDT`,
                                useCache
                            );
                            isolatedMarginUSDT += quoteNetAmount * price;
                        } catch (error) {
                            console.warn(
                                `Failed to get price for ${asset.quoteAsset.asset}:`,
                                error
                            );
                        }
                    }
                }
            }

            const result = {
                totalUSDT: spotUSDT + marginUSDT + isolatedMarginUSDT,
                spotUSDT,
                marginUSDT,
                isolatedMarginUSDT,
            };

            // Cache the result and mark as initialized
            this.balanceCache = result;
            this.lastUpdateTime = Date.now();
            this.isInitialized = true;

            return result;
        } catch (error) {
            console.error('Failed to calculate total estimated balance:', error);
            throw error;
        }
    }

    // Keep the old function for backward compatibility
    async getTotalBalanceInUSDT(): Promise<number> {
        const estimated = await this.getTotalEstimatedBalance();
        return estimated.totalUSDT;
    }

    async getPrice(symbol: string, useCache = false): Promise<number> {
        try {
            // Check cache first if requested
            if (useCache && this.priceCache.has(symbol.toUpperCase())) {
                return this.priceCache.get(symbol.toUpperCase())!;
            }

            const response = await axios.get(
                `${this.baseUrl}/api/v3/ticker/price?symbol=${symbol}`
            );
            const data = response.data as { price: string };
            const price = parseFloat(data.price);

            // Cache the price
            this.priceCache.set(symbol.toUpperCase(), price);

            return price;
        } catch (error) {
            console.error(`Failed to get price for ${symbol}:`, error);
            throw error;
        }
    }

    refreshConfiguration() {
        this.loadConfiguration();
        // Reset last update time to immediately apply new silent refresh interval
        this.lastUpdateTime = 0;
    }

    dispose() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    isConfigured(): boolean {
        return this.apiKey.length > 0 && this.apiSecret.length > 0;
    }
}
