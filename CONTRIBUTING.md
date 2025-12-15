# Contribution Guidelines

## Code Style and Formatting

This project uses `.editorconfig` and `.prettierrc` for consistent code formatting.

### EditorConfig Settings

- **Indent size**: 4 spaces for TypeScript files, 2 spaces for others
- **End of line**: LF (Unix-style)
- **Insert final newline**: Yes
- **Trim trailing whitespace**: Yes

### Prettier Settings

- **Print width**: 100 characters
- **Quotes**: Single quotes
- **Trailing commas**: ES5 style

**Before committing**, ensure your code is formatted:

```bash
pnpm run format
```

## Comment Guidelines

### Primary Rule: English JSDoc Comments

All code comments should follow these principles:

#### 1. Use JSDoc Format

- **Always use JSDoc** for functions, classes, interfaces, and complex logic
- English is the **required language** for all JSDoc comments
- JSDoc enables better IDE support, auto-completion, and type hints

#### 2. Comment Types Priority

**High Priority (Required)**

```typescript
/**
 * Calculate total wallet balance across all account types.
 * Converts BTC-denominated balances to USDT using current market price.
 *
 * @param useCache - Whether to use cached price data
 * @returns Total estimated balance in USDT across all accounts
 * @throws {Error} When API credentials are not configured
 */
async getTotalEstimatedBalance(useCache = false): Promise<TotalEstimatedBalance> {
  // Implementation
}
```

**Medium Priority (Recommended)**

```typescript
export interface TotalEstimatedBalance {
  /** Total balance across all account types in USDT */
  totalUSDT: number;
  /** Spot wallet balance in USDT */
  spotUSDT: number;
  /** Cross margin balance in USDT */
  marginUSDT: number;
  /** Isolated margin balance in USDT */
  isolatedMarginUSDT: number;
}
```

**Low Priority (Optional)**

```typescript
// Only add inline comments for complex business logic
if (baseNetAmount !== 0) {
  // Convert base asset to USDT if not already in USDT
  if (asset.baseAsset.asset === 'USDT') {
    isolatedMarginUSDT += baseNetAmount;
  } else {
    const price = await this.getPrice(`${asset.baseAsset.asset}USDT`, useCache);
    isolatedMarginUSDT += baseNetAmount * price;
  }
}
```

#### 3. When to Write Comments

**DO Comment:**

- Public API functions and methods
- Complex business logic that isn't immediately obvious
- Type definitions and interfaces
- Important parameters and return values
- Error conditions and exceptions

**DON'T Comment:**

- Self-explanatory code
- Obvious variable names
- Simple getters/setters
- Code that can be refactored to be more readable instead

#### 4. JSDoc Tags Reference

````typescript
/**
 * Brief description of what the function does.
 * More detailed explanation if needed (optional).
 *
 * @param paramName - Description of parameter
 * @param optionalParam - Description (optional, default: value)
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 * @example
 * ```typescript
 * const balance = await getTotalBalance(true);
 * console.log(balance.totalUSDT);
 * ```
 */
````

#### 5. Good vs Bad Examples

**✅ Good**

```typescript
/**
 * Fetch isolated margin account balance from Binance API.
 * Filters out assets with zero net balance.
 *
 * @returns Array of isolated margin assets with non-zero balances
 * @throws {Error} If API credentials are missing or invalid
 */
async getIsolatedMarginAccountBalance(): Promise<IsolatedMarginAsset[]> {
    try {
        const data = await this.makeRequest('/sapi/v1/margin/isolated/account');
        return data.assets.filter((asset: IsolatedMarginAsset) =>
            parseFloat(asset.baseAsset.netAsset) !== 0 ||
            parseFloat(asset.quoteAsset.netAsset) !== 0
        );
    } catch (error) {
        console.error('Failed to fetch isolated margin balance:', error);
        return [];
    }
}
```

**❌ Bad**

```typescript
// 격리 마진 계좌 잔액을 가져옴
async getIsolatedMarginAccountBalance(): Promise<IsolatedMarginAsset[]> {
    // 데이터 요청
    const data = await this.makeRequest('/sapi/v1/margin/isolated/account');
    // 0이 아닌 것만 필터링
    return data.assets.filter((asset: IsolatedMarginAsset) =>
        parseFloat(asset.baseAsset.netAsset) !== 0
    );
}
```

**Problems with the bad example:**

- Korean comments (not searchable/readable for international developers)
- No JSDoc format (no IDE support)
- Missing error handling documentation
- Inline comments state the obvious

#### 6. Language Rules

- **JSDoc comments**: Always English
- **Code identifiers** (variables, functions, classes): Always English
- **Inline comments**: English preferred, Korean acceptable only for business-specific context
- **Commit messages**: English preferred
- **User-facing strings**: Korean (can be in separate i18n files)

## TypeScript Best Practices

### Type Safety

- Use explicit types for function parameters and return values
- Avoid `any` type; use `unknown` when type is truly unknown
- Define interfaces for complex data structures

### Error Handling

- Always handle errors in async functions
- Log errors with meaningful context
- Return empty arrays/objects as fallback when appropriate

### Code Organization

- One class/interface per file when possible
- Group related functionality together
- Keep functions focused and single-purpose

## Git Commit Messages

Follow conventional commit format:

```
feat: Add isolated margin balance calculation
fix: Correct price conversion for BTC to USDT
docs: Update README with new configuration options
refactor: Extract balance calculation to separate method
```

## Before Submitting

1. Run `pnpm run compile` to ensure no TypeScript errors
2. Run `pnpm run format` to format code
3. Test the extension locally
4. Update README.md if adding new features
5. Ensure all JSDoc comments are in English
