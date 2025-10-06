import * as vscode from 'vscode';
import { BinanceApiClient } from './binanceApi';

export class BalanceStatusBar implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private refreshTimer?: NodeJS.Timeout;
    private isUpdating = false;
    private hasInitialData = false;
    private outputChannel: vscode.OutputChannel;

    constructor(private binanceApi: BinanceApiClient) {
        this.outputChannel = vscode.window.createOutputChannel('Binance Balance Monitor');

        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );

        this.statusBarItem.command = 'binanceBalance.refresh';
        this.statusBarItem.tooltip = 'Click to refresh Binance balance';
        this.statusBarItem.show();

        this.updateStatusBar('⚠️ Not configured');

        // Set up silent update callback
        this.binanceApi.onBalanceUpdate((balance) => {
            this.updateBalanceDisplay(balance, true); // true = silent update
        });
    }

    start() {
        this.refresh();
        this.scheduleNextUpdate();
    }

    async refresh() {
        if (this.isUpdating) {
            return;
        }

        this.isUpdating = true;

        try {
            if (!this.binanceApi.isConfigured()) {
                this.updateStatusBar('⚠️ Configure API');
                this.statusBarItem.tooltip = 'Click to configure Binance API credentials';
                this.statusBarItem.command = 'binanceBalance.configure';
                return;
            }

            // Only show loading for initial load
            if (!this.hasInitialData) {
                this.updateStatusBar('🔄 Loading...');
                this.statusBarItem.tooltip = 'Loading balance...';
            }

            const estimatedBalance = await this.binanceApi.getTotalEstimatedBalance();
            this.updateBalanceDisplay(estimatedBalance, false); // false = not silent

            this.hasInitialData = true;
        } catch (error) {
            this.outputChannel.appendLine(`[ERROR] Failed to update balance: ${error}`);
            console.error('Failed to update balance:', error);
            this.updateStatusBar('❌ Error');

            let errorMessage = 'Unknown error';
            if (error instanceof Error) {
                errorMessage = error.message;
            }

            this.statusBarItem.tooltip = `Error: ${errorMessage}\\nClick to retry`;
            this.statusBarItem.command = 'binanceBalance.refresh';
        } finally {
            this.isUpdating = false;
        }
    }

    private formatBalance(balance: number, symbol: string): string {
        if (symbol === 'USDT') {
            return `$${balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`;
        } else {
            const decimals = symbol === 'BTC' ? 6 : 4;
            return `${balance.toFixed(decimals)} ${symbol}`;
        }
    }

    private updateStatusBar(text: string) {
        this.statusBarItem.text = text;
    }

    private async updateBalanceDisplay(estimatedBalance: any, silent = false) {
        try {
            const config = vscode.workspace.getConfiguration('binanceBalance');
            const displayCurrency = config.get<string>('displayCurrency', 'USDT');

            let balance: number;
            let symbol: string;

            if (displayCurrency === 'USDT') {
                balance = estimatedBalance.totalUSDT;
                symbol = 'USDT';
            } else {
                if (displayCurrency === 'BTC') {
                    const btcPrice = await this.binanceApi.getPrice('BTCUSDT', silent); // Use cache for silent updates
                    balance = estimatedBalance.totalUSDT / btcPrice;
                    symbol = 'BTC';
                } else if (displayCurrency === 'ETH') {
                    const ethPrice = await this.binanceApi.getPrice('ETHUSDT', silent);
                    balance = estimatedBalance.totalUSDT / ethPrice;
                    symbol = 'ETH';
                } else if (displayCurrency === 'BNB') {
                    const bnbPrice = await this.binanceApi.getPrice('BNBUSDT', silent);
                    balance = estimatedBalance.totalUSDT / bnbPrice;
                    symbol = 'BNB';
                } else {
                    balance = estimatedBalance.totalUSDT;
                    symbol = 'USDT';
                }
            }

            const displayConfig = vscode.workspace.getConfiguration('binanceBalance');
            const showIcon = displayConfig.get<boolean>('showIcon', true);
            const formattedBalance = this.formatBalance(balance, symbol);
            const displayText = showIcon ? `💰 ${formattedBalance}` : formattedBalance;
            this.updateStatusBar(displayText);

            const lastUpdate = new Date().toLocaleTimeString();
            const spotFormatted = this.formatBalance(estimatedBalance.spotUSDT, 'USDT');
            const marginFormatted = this.formatBalance(estimatedBalance.marginUSDT, 'USDT');

            const updateType = silent ? 'Live' : 'Manual';
            this.statusBarItem.tooltip =
                `Total Estimated: ${formattedBalance}\\n` +
                `Spot: ${spotFormatted}\\n` +
                `Margin: ${marginFormatted}\\n` +
                `Last updated: ${lastUpdate} (${updateType})\\n` +
                `Click to refresh`;
            this.statusBarItem.command = 'binanceBalance.refresh';
        } catch (error) {
            if (!silent) {
                this.outputChannel.appendLine(`[ERROR] Failed to update balance display: ${error}`);
                console.error('Failed to update balance display:', error);
            }
        }
    }

    private scheduleNextUpdate() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }

        const config = vscode.workspace.getConfiguration('binanceBalance');
        const refreshInterval = config.get<number>('refreshInterval', 10000);

        this.refreshTimer = setTimeout(() => {
            this.refresh();
            this.scheduleNextUpdate();
        }, refreshInterval);
    }

    dispose() {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
        }
        this.statusBarItem.dispose();
        this.outputChannel.dispose();
    }
}
