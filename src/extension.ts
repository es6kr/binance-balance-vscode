import * as vscode from 'vscode';
import { BinanceApiClient } from './binanceApi';
import { BalanceStatusBar } from './statusBar';

let binanceApi: BinanceApiClient;
let statusBar: BalanceStatusBar;
let outputChannel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('Binance Balance Monitor');
    outputChannel.appendLine('=== Binance Balance Monitor Extension Started ===');
    outputChannel.appendLine(`Extension path: ${context.extensionPath}`);
    outputChannel.appendLine(`VS Code version: ${vscode.version}`);

    console.log('Binance Balance Monitor is now active!');

    try {
        binanceApi = new BinanceApiClient();
        outputChannel.appendLine('BinanceApiClient created successfully');

        statusBar = new BalanceStatusBar(binanceApi);
        outputChannel.appendLine('BalanceStatusBar created successfully');
    } catch (error) {
        outputChannel.appendLine(`Error during initialization: ${error}`);
        vscode.window.showErrorMessage(`Binance Balance Monitor failed to initialize: ${error}`);
    }

    const refreshCommand = vscode.commands.registerCommand('binanceBalance.refresh', () => {
        outputChannel.appendLine('Refresh command executed');
        binanceApi.refreshConfiguration();
        statusBar.refresh();
    });

    const configureCommand = vscode.commands.registerCommand('binanceBalance.configure', () => {
        outputChannel.appendLine('Configure command executed');
        showConfigurationDialog();
    });

    const showBalancesCommand = vscode.commands.registerCommand(
        'binanceBalance.showBalances',
        () => {
            outputChannel.appendLine('Show balances command executed');
            showDetailedBalances();
        }
    );

    outputChannel.appendLine('All commands registered successfully:');
    outputChannel.appendLine('- binanceBalance.refresh');
    outputChannel.appendLine('- binanceBalance.configure');
    outputChannel.appendLine('- binanceBalance.showBalances');

    context.subscriptions.push(
        refreshCommand,
        configureCommand,
        showBalancesCommand,
        statusBar,
        outputChannel
    );

    try {
        statusBar.start();
        outputChannel.appendLine('StatusBar started successfully');
    } catch (error) {
        outputChannel.appendLine(`Error starting StatusBar: ${error}`);
    }

    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('binanceBalance')) {
            outputChannel.appendLine('Configuration changed, refreshing...');
            binanceApi.refreshConfiguration();
            statusBar.refresh();
        }
    });

    outputChannel.appendLine('=== Extension activation completed ===');

    // Show a notification that the extension has started
    vscode.window.showInformationMessage(
        'Binance Balance Monitor activated! Check Output panel for logs.'
    );

    // Show the output channel
    outputChannel.show(true);
}

async function showConfigurationDialog() {
    outputChannel.appendLine('Configuration dialog started');

    const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter your Binance API Key',
        password: false,
        ignoreFocusOut: true,
        placeHolder: 'Your Binance API Key...',
    });

    if (!apiKey) {
        outputChannel.appendLine('API Key input cancelled');
        return;
    }

    outputChannel.appendLine('API Key provided, requesting secret...');

    const apiSecret = await vscode.window.showInputBox({
        prompt: 'Enter your Binance API Secret',
        password: true,
        ignoreFocusOut: true,
        placeHolder: 'Your Binance API Secret...',
    });

    if (!apiSecret) {
        outputChannel.appendLine('API Secret input cancelled');
        return;
    }

    outputChannel.appendLine('Both credentials provided, saving configuration...');

    try {
        const config = vscode.workspace.getConfiguration('binanceBalance');
        await config.update('apiKey', apiKey, vscode.ConfigurationTarget.Global);
        await config.update('apiSecret', apiSecret, vscode.ConfigurationTarget.Global);

        outputChannel.appendLine('Credentials saved successfully');
        vscode.window.showInformationMessage('Binance API credentials saved successfully!');

        binanceApi.refreshConfiguration();
        statusBar.refresh();
        outputChannel.appendLine('Configuration refreshed');
    } catch (error) {
        outputChannel.appendLine(`Failed to save credentials: ${error}`);
        vscode.window.showErrorMessage(`Failed to save credentials: ${error}`);
    }
}

async function showDetailedBalances() {
    try {
        if (!binanceApi.isConfigured()) {
            vscode.window.showWarningMessage(
                'Please configure your Binance API credentials first.'
            );
            return;
        }

        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Fetching detailed balances...',
                cancellable: false,
            },
            async () => {
                const [spotBalances, marginBalances, estimatedBalance] = await Promise.all([
                    binanceApi.getAccountBalance(),
                    binanceApi.getMarginAccountBalance(),
                    binanceApi.getTotalEstimatedBalance(),
                ]);

                const items = [];

                // Add summary item
                items.push({
                    label: '📊 TOTAL ESTIMATED',
                    description: `${estimatedBalance.totalUSDT.toFixed(2)} USDT`,
                    detail: `Spot: ${estimatedBalance.spotUSDT.toFixed(
                        2
                    )} USDT | Margin: ${estimatedBalance.marginUSDT.toFixed(2)} USDT`,
                });

                // Add separator
                items.push({
                    label: '--- SPOT BALANCES ---',
                    description: '',
                    detail: '',
                });

                // Add spot balances
                if (spotBalances.length > 0) {
                    spotBalances.forEach((balance) => {
                        const total = parseFloat(balance.free) + parseFloat(balance.locked);
                        items.push({
                            label: `🟢 ${balance.asset}`,
                            description: `Total: ${total.toFixed(8)}`,
                            detail: `Free: ${balance.free}, Locked: ${balance.locked}`,
                        });
                    });
                }

                // Add margin section if exists
                if (marginBalances.length > 0) {
                    items.push({
                        label: '--- MARGIN BALANCES ---',
                        description: '',
                        detail: '',
                    });

                    marginBalances.forEach((balance) => {
                        const netAsset = parseFloat(balance.netAsset);
                        items.push({
                            label: `🔴 ${balance.asset}`,
                            description: `Net: ${netAsset.toFixed(8)}`,
                            detail: `Free: ${balance.free}, Locked: ${balance.locked}, Borrowed: ${balance.borrowed}`,
                        });
                    });
                }

                if (items.length === 1) {
                    // Only summary item
                    vscode.window.showInformationMessage('No balances found.');
                    return;
                }

                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select an asset to view details',
                    title: 'Total Estimated Balance (Spot + Margin)',
                });

                if (selected && selected.detail) {
                    vscode.window.showInformationMessage(`${selected.label}: ${selected.detail}`);
                }
            }
        );
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to fetch balances: ${error}`);
    }
}

export function deactivate() {
    console.log('Binance Balance Monitor is deactivated.');
    if (outputChannel) {
        outputChannel.appendLine('=== Extension deactivating ===');
    }
    if (binanceApi) {
        binanceApi.dispose();
    }
    if (statusBar) {
        statusBar.dispose();
    }
    if (outputChannel) {
        outputChannel.appendLine('Extension deactivated');
        outputChannel.dispose();
    }
}
