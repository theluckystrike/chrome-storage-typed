/**
 * @theluckystrike/chrome-storage-typed
 * Type-safe wrapper for Chrome extension storage API.
 *
 * Built by theluckystrike — https://zovo.one
 */

export type StorageArea = 'local' | 'sync' | 'session';

function getArea(area: StorageArea): chrome.storage.StorageArea {
  switch (area) {
    case 'local':
      return chrome.storage.local;
    case 'sync':
      return chrome.storage.sync;
    case 'session':
      return chrome.storage.session;
    default:
      throw new Error(`Unknown storage area: ${area as string}`);
  }
}

/**
 * Get a typed value from Chrome storage.
 */
export async function get<T>(key: string, area: StorageArea = 'local'): Promise<T | undefined> {
  const result = await getArea(area).get(key);
  return result[key] as T | undefined;
}

/**
 * Set a typed value in Chrome storage.
 */
export async function set<T>(key: string, value: T, area: StorageArea = 'local'): Promise<void> {
  await getArea(area).set({ [key]: value });
}

/**
 * Remove a key from Chrome storage.
 */
export async function remove(key: string, area: StorageArea = 'local'): Promise<void> {
  await getArea(area).remove(key);
}

/**
 * Get multiple typed values from Chrome storage.
 */
export async function getMany<T extends Record<string, unknown>>(
  keys: (keyof T)[],
  area: StorageArea = 'local'
): Promise<Partial<T>> {
  const result = await getArea(area).get(keys as string[]);
  return result as Partial<T>;
}

/**
 * Set multiple values in Chrome storage.
 */
export async function setMany<T extends Record<string, unknown>>(
  items: T,
  area: StorageArea = 'local'
): Promise<void> {
  await getArea(area).set(items);
}

/**
 * Watch a key for changes. Returns an unsubscribe function.
 */
export function watch<T>(
  key: string,
  callback: (newValue: T | undefined, oldValue: T | undefined) => void,
  area: StorageArea = 'local'
): () => void {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ): void => {
    if (areaName === area && key in changes) {
      const change = changes[key];
      callback(
        change.newValue as T | undefined,
        change.oldValue as T | undefined
      );
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

/**
 * Clear all data in a storage area.
 */
export async function clear(area: StorageArea = 'local'): Promise<void> {
  await getArea(area).clear();
}

/** Chrome sync storage quota constants */
export const SYNC_QUOTA = {
  QUOTA_BYTES: 102400,
  QUOTA_BYTES_PER_ITEM: 8192,
  MAX_ITEMS: 512,
  MAX_WRITE_OPERATIONS_PER_HOUR: 1800,
  MAX_WRITE_OPERATIONS_PER_MINUTE: 120,
} as const;

/**
 * Get the bytes in use for a storage area.
 */
export async function getBytesInUse(keys?: string | string[], area: StorageArea = 'local'): Promise<number> {
  return getArea(area).getBytesInUse(keys ?? null);
}
