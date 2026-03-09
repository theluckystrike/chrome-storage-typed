[![CI](https://github.com/theluckystrike/chrome-storage-typed/actions/workflows/ci.yml/badge.svg)](https://github.com/theluckystrike/chrome-storage-typed/actions)
[![npm](https://img.shields.io/npm/v/@theluckystrike/chrome-storage-typed)](https://www.npmjs.com/package/@theluckystrike/chrome-storage-typed)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

# @theluckystrike/chrome-storage-typed

TypeScript-first typed storage for Chrome extensions. A type-safe, developer-friendly wrapper around the Chrome Storage API with full TypeScript support, automatic serialization, and reactive change watching.

## Why chrome-storage-typed?

Building Chrome extensions with TypeScript? The raw `chrome.storage` API returns `any` types, forcing you to manually cast values and miss out on type safety. This library provides:

- **Full TypeScript Support** — Generic type inference for all storage operations
- **Automatic Serialization** — Store objects, arrays, and complex types seamlessly
- **Reactive Watching** — Subscribe to storage changes with type-safe callbacks
- **Storage Areas** — Easy access to local, sync, and session storage
- **Batch Operations** — Efficiently get/set multiple values at once

## Install

```bash
# npm
npm install @theluckystrike/chrome-storage-typed

# pnpm
pnpm add @theluckystrike/chrome-storage-typed

# yarn
yarn add @theluckystrike/chrome-storage-typed
```

## Quick Start

```typescript
import { get, set, watch, remove, getMany, setMany, clear } from '@theluckystrike/chrome-storage-typed';

// Store and retrieve typed values
await set('username', 'alice');
const username = await get<string>('username'); // string | undefined

// Use different storage areas
await set('sessionToken', 'abc123', 'session');
await set('syncedPref', true, 'sync');

// Batch operations
await setMany({ theme: 'dark', fontSize: 14, lang: 'en' });
const prefs = await getMany<{ theme: string; fontSize: number }>(['theme', 'fontSize']);

// Watch for changes
const unsubscribe = watch<string>('username', (newValue, oldValue) => {
  console.log(`Changed from ${oldValue} to ${newValue}`);
});

// Cleanup
unsubscribe();
await remove('username');
await clear('local');
```

## Defining a Schema

For the best TypeScript experience, define a schema type that describes your entire storage structure:

```typescript
// types/storage.ts
export interface AppStorage {
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  
  preferences: {
    theme: 'light' | 'dark';
    fontSize: number;
    notifications: boolean;
  };
  
  sessionToken: string | null;
  lastSync: number;
}

// Then use it throughout your extension
import { get, set, watch, getMany, setMany } from '@theluckystrike/chrome-storage-typed';
import type { AppStorage } from './types/storage';

// Single value with full type safety
const user = await get<AppStorage['user']>('user');
// Type: { id: number; name: string; email: string } | null | undefined

// Batch get with type inference
const { preferences, lastSync } = await getMany<AppStorage>(['preferences', 'lastSync']);
// Type: { preferences: {...}; lastSync: number } | Partial<AppStorage>

// Batch set
await setMany<AppStorage>({
  preferences: { theme: 'dark', fontSize: 16, notifications: true },
  lastSync: Date.now(),
} as Partial<AppStorage>);

// Watch with full type safety
watch<AppStorage['preferences']>('preferences', (newPrefs, oldPrefs) => {
  console.log(`Theme changed from ${oldPrefs?.theme} to ${newPrefs?.theme}`);
});
```

## Storage Areas

Chrome provides three storage areas, each with different use cases:

### Local Storage (`'local'`)
- Stored on the local machine, not synced across devices
- No size limits (except for local disk space)
- Best for: App state, cached data, user preferences

```typescript
// Default storage area
await set('appState', { activeTab: 1 });
const state = await get<{ activeTab: number }>('appState', 'local');
```

### Sync Storage (`'sync'`)
- Synced across all devices where the user is signed in
- Limited quota: 100KB total, 8KB per item
- Best for: User preferences that should follow the user

```typescript
// Automatically synced across devices
await set('syncSettings', { theme: 'dark' }, 'sync');
await get<{ theme: string }>('syncSettings', 'sync');

// Be aware of sync quotas
import { SYNC_QUOTA } from '@theluckystrike/chrome-storage-typed';
console.log(`Max sync storage: ${SYNC_QUOTA.QUOTA_BYTES / 1024}KB`);
console.log(`Max item size: ${SYNC_QUOTA.QUOTA_BYTES_PER_ITEM / 1024}KB`);
```

### Session Storage (`'session'`)
- Only available while the browser is running
- Data cleared when the browser closes (or extension is reloaded)
- Accessible from background scripts, popup, and content scripts
- Best for: Temporary data, sensitive session tokens

```typescript
// Session-only storage (cleared on browser close)
await set('tempToken', 'ephemeral-token', 'session');
const tempToken = await get<string>('tempToken', 'session');
```

## Migration Guide from Raw chrome.storage

If you're currently using the raw Chrome Storage API, here's how to migrate:

### Before (Raw chrome.storage)

```typescript
// Raw chrome.storage - no type safety
chrome.storage.local.set({ username: 'alice' });

chrome.storage.local.get('username', (result) => {
  const username = result.username as string; // Manual casting required
  console.log(username);
});

// Watching changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (changes.username) {
    const newValue = changes.username.newValue as string;
    const oldValue = changes.username.oldValue as string;
    console.log(`Changed from ${oldValue} to ${newValue}`);
  }
});
```

### After (chrome-storage-typed)

```typescript
import { get, set, watch } from '@theluckystrike/chrome-storage-typed';

// Set with automatic type inference
await set('username', 'alice');

// Get with full type safety - no casting needed!
const username = await get<string>('username');
// TypeScript knows it's string | undefined

// Watching changes - fully typed callback
const unsubscribe = watch<string>('username', (newValue, oldValue) => {
  // Both newValue and oldValue are typed as string | undefined
  console.log(`Changed from ${oldValue} to ${newValue}`);
});
```

### Key Differences

| Feature | Raw chrome.storage | chrome-storage-typed |
|---------|-------------------|---------------------|
| Type Safety | Manual casting | Automatic inference |
| Serialization | Manual JSON.stringify | Automatic |
| Change Watching | Complex callback | Simple subscribe/unsubscribe |
| Batch Operations | Manual iteration | Built-in getMany/setMany |
| Error Handling | Try/catch needed | TypeScript errors at compile time |

## API Reference

### `get<T>(key: string, area?: StorageArea): Promise<T | undefined>`

Retrieves a typed value from Chrome storage.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | — | Storage key to retrieve |
| `area` | `StorageArea` | `'local'` | Storage area: `'local'`, `'sync'`, or `'session'` |

**Returns:** `Promise<T | undefined>`

```typescript
const username = await get<string>('username');
const settings = await get<{ theme: string }>('settings', 'sync');
```

---

### `set<T>(key: string, value: T, area?: StorageArea): Promise<void>`

Stores a typed value in Chrome storage. Objects and arrays are automatically serialized.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | — | Storage key |
| `value` | `T` | — | Value to store (can be any serializable type) |
| `area` | `StorageArea` | `'local'` | Storage area |

**Returns:** `Promise<void>`

```typescript
await set('user', { name: 'Alice', id: 1 });
await set('token', 'abc123', 'session');
```

---

### `remove(key: string, area?: StorageArea): Promise<void>`

Removes a key from Chrome storage.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | — | Storage key to remove |
| `area` | `StorageArea` | `'local'` | Storage area |

**Returns:** `Promise<void>`

```typescript
await remove('tempData');
await remove('oldToken', 'session');
```

---

### `getMany<T>(keys: (keyof T)[], area?: StorageArea): Promise<Partial<T>>`

Retrieves multiple typed values from Chrome storage in a single call.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keys` | `(keyof T)[]` | — | Array of keys to retrieve |
| `area` | `StorageArea` | `'local'` | Storage area |

**Returns:** `Promise<Partial<T>>`

```typescript
const { theme, fontSize, language } = await getMany<{
  theme: string;
  fontSize: number;
  language: string;
}>(['theme', 'fontSize', 'language']);
```

---

### `setMany<T>(items: Partial<T>, area?: StorageArea): Promise<void>`

Stores multiple values in Chrome storage in a single call.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `Partial<T>` | — | Object of key-value pairs to store |
| `area` | `StorageArea` | `'local'` | Storage area |

**Returns:** `Promise<void>`

```typescript
await setMany({
  theme: 'dark',
  fontSize: 16,
  language: 'en',
});
```

---

### `watch<T>(key: string, callback: WatchCallback<T>, area?: StorageArea): () => void`

Watches a key for changes. Returns an unsubscribe function that can be called to stop watching.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | — | Key to watch |
| `callback` | `WatchCallback<T>` | — | Change handler function |
| `area` | `StorageArea` | `'local'` | Storage area to watch |

**Returns:** `() => void` — Call to unsubscribe

```typescript
const unsubscribe = watch<string>('username', (newValue, oldValue) => {
  console.log(`Username changed from "${oldValue}" to "${newValue}"`);
});

// Later, stop watching
unsubscribe();
```

**WatchCallback Type:**
```typescript
type WatchCallback<T> = (
  newValue: T | undefined,
  oldValue: T | undefined
) => void;
```

---

### `clear(area?: StorageArea): Promise<void>`

Clears all data in the specified storage area. Use with caution!

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `area` | `StorageArea` | `'local'` | Storage area to clear |

**Returns:** `Promise<void>`

```typescript
// Clear local storage
await clear('local');

// Clear all session data
await clear('session');
```

---

### `getBytesInUse(keys?: string | string[], area?: StorageArea): Promise<number>`

Gets the amount of storage space used by one or more items, or the entire storage area.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keys` | `string \| string[]` | — | Specific key(s) to check, or undefined for entire area |
| `area` | `StorageArea` | `'local'` | Storage area |

**Returns:** `Promise<number>` — Bytes in use

```typescript
const bytesUsed = await getBytesInUse('settings');
const totalBytes = await getBytesInUse();
console.log(`Settings uses ${bytesUsed} bytes`);
```

---

## Types

### `StorageArea`

```typescript
type StorageArea = 'local' | 'sync' | 'session';
```

### `StorageChangeEvent<T>`

```typescript
interface StorageChangeEvent<T> {
  newValue: T | undefined;
  oldValue: T | undefined;
}
```

### `SYNC_QUOTA`

Chrome sync storage has built-in quota limits:

```typescript
const SYNC_QUOTA = {
  QUOTA_BYTES: 102400,           // 100KB total
  QUOTA_BYTES_PER_ITEM: 8192,   // 8KB per item
  MAX_ITEMS: 512,               // Max 512 items
  MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
  MAX_WRITE_OPERATIONS_PER_MINUTE: 120,
} as const;
```

## Best Practices

### 1. Define a Schema Type

Always define a TypeScript interface for your storage to get full type safety:

```typescript
interface MyAppStorage {
  // Use nullable types for optional data
  user: UserProfile | null;
  
  // Use specific string unions for enums
  theme: 'light' | 'dark' | 'system';
  
  // Always handle undefined in your code
  lastAccessed: number | undefined;
}
```

### 2. Use Batch Operations

Prefer `getMany` and `setMany` over multiple individual calls:

```typescript
// ❌ Bad: Multiple round trips
await set('key1', value1);
await set('key2', value2);
await set('key3', value3);

// ✅ Good: Single operation
await setMany({ key1: value1, key2: value2, key3: value3 });
```

### 3. Clean Up Watchers

Always unsubscribe when your component/context is destroyed:

```typescript
useEffect(() => {
  const unsubscribe = watch('settings', handleSettingsChange);
  return () => unsubscribe(); // Clean up on unmount
}, []);
```

### 4. Use Appropriate Storage Areas

- **`local`**: App state, cached data, large datasets
- **`sync`**: User preferences that should sync across devices
- **`session`**: Temporary data, sensitive information that shouldn't persist

## Requirements

- Chrome Extension (Manifest V3)
- TypeScript 5.0+
- `chrome-types` or `@types/chrome` for Chrome API types

## License

MIT

---

Built by [theluckystrike](https://github.com/theluckystrike) — [zovo.one](https://zovo.one)
