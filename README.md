# @theluckystrike/chrome-storage-typed

Type-safe wrapper for the Chrome storage API with automatic serialization.

[![npm version](https://img.shields.io/npm/v/@theluckystrike/chrome-storage-typed)](https://www.npmjs.com/package/@theluckystrike/chrome-storage-typed)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install @theluckystrike/chrome-storage-typed
```

## Usage

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

## API Reference

### `get<T>(key, area?): Promise<T | undefined>`

Retrieves a typed value from Chrome storage.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | -- | Storage key to retrieve |
| `area` | `StorageArea` | `'local'` | Storage area: `'local'`, `'sync'`, or `'session'` |

### `set<T>(key, value, area?): Promise<void>`

Stores a typed value in Chrome storage.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | -- | Storage key |
| `value` | `T` | -- | Value to store |
| `area` | `StorageArea` | `'local'` | Storage area |

### `remove(key, area?): Promise<void>`

Removes a key from Chrome storage.

### `getMany<T>(keys, area?): Promise<Partial<T>>`

Retrieves multiple typed values from Chrome storage in a single call.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `keys` | `(keyof T)[]` | -- | Array of keys to retrieve |
| `area` | `StorageArea` | `'local'` | Storage area |

### `setMany<T>(items, area?): Promise<void>`

Stores multiple values in Chrome storage in a single call.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `items` | `T` | -- | Object of key-value pairs to store |
| `area` | `StorageArea` | `'local'` | Storage area |

### `watch<T>(key, callback, area?): () => void`

Watches a key for changes. Returns an unsubscribe function.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `key` | `string` | -- | Key to watch |
| `callback` | `(newValue: T \| undefined, oldValue: T \| undefined) => void` | -- | Change handler |
| `area` | `StorageArea` | `'local'` | Storage area to watch |

### `clear(area?): Promise<void>`

Clears all data in the specified storage area.

### Types

```typescript
type StorageArea = 'local' | 'sync' | 'session';

interface StorageChangeEvent<T> {
  newValue: T | undefined;
  oldValue: T | undefined;
}
```

## License

MIT - Built by [theluckystrike](https://github.com/theluckystrike) | [zovo.one](https://zovo.one)
