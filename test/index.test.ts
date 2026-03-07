import { describe, it, expect, beforeEach } from 'vitest';
import { resetChromeMocks } from './setup';
import { get, set, remove, getMany, setMany, watch, clear, SYNC_QUOTA, getBytesInUse } from '../src/index';

describe('chrome-storage-typed', () => {
  beforeEach(() => {
    resetChromeMocks();
  });

  describe('get', () => {
    it('should retrieve a value from local storage by default', async () => {
      await set('testKey', 'testValue');
      const result = await get<string>('testKey');
      expect(chrome.storage.local.get).toHaveBeenCalledWith('testKey');
      expect(result).toBe('testValue');
    });

    it('should retrieve a value from sync storage when specified', async () => {
      await set('syncKey', 42, 'sync');
      const result = await get<number>('syncKey', 'sync');
      expect(chrome.storage.sync.get).toHaveBeenCalledWith('syncKey');
      expect(result).toBe(42);
    });

    it('should return undefined for missing keys', async () => {
      const result = await get<string>('nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should store a value in local storage', async () => {
      await set('key1', { name: 'test', count: 5 });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ key1: { name: 'test', count: 5 } });
    });

    it('should store a value in session storage when specified', async () => {
      await set('sessionKey', true, 'session');
      expect(chrome.storage.session.set).toHaveBeenCalledWith({ sessionKey: true });
    });
  });

  describe('remove', () => {
    it('should remove a key from storage', async () => {
      await set('toRemove', 'value');
      await remove('toRemove');
      expect(chrome.storage.local.remove).toHaveBeenCalledWith('toRemove');
    });
  });

  describe('getMany', () => {
    it('should retrieve multiple keys at once', async () => {
      await set('a', 1);
      await set('b', 2);
      const result = await getMany<{ a: number; b: number }>(['a', 'b']);
      expect(chrome.storage.local.get).toHaveBeenCalled();
      expect(result).toHaveProperty('a');
    });
  });

  describe('setMany', () => {
    it('should store multiple values at once', async () => {
      await setMany({ x: 10, y: 20 });
      expect(chrome.storage.local.set).toHaveBeenCalledWith({ x: 10, y: 20 });
    });
  });

  describe('watch', () => {
    it('should register a listener for storage changes', () => {
      const callback = vi.fn();
      watch<string>('watchedKey', callback);
      expect(chrome.storage.onChanged.addListener).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function that removes the listener', () => {
      const callback = vi.fn();
      const unsubscribe = watch<string>('watchedKey', callback);
      unsubscribe();
      expect(chrome.storage.onChanged.removeListener).toHaveBeenCalledTimes(1);
    });

    it('should call callback when the watched key changes', () => {
      const callback = vi.fn();
      watch<string>('watchedKey', callback);

      // Get the listener that was registered
      const listener = (chrome.storage.onChanged.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate a change event
      listener(
        { watchedKey: { newValue: 'new', oldValue: 'old' } },
        'local'
      );

      expect(callback).toHaveBeenCalledWith('new', 'old');
    });

    it('should not call callback for changes in a different area', () => {
      const callback = vi.fn();
      watch<string>('watchedKey', callback, 'sync');

      const listener = (chrome.storage.onChanged.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate change in 'local', but we're watching 'sync'
      listener(
        { watchedKey: { newValue: 'new', oldValue: 'old' } },
        'local'
      );

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all data in the specified storage area', async () => {
      await clear();
      expect(chrome.storage.local.clear).toHaveBeenCalledTimes(1);
    });

    it('should clear sync storage when specified', async () => {
      await clear('sync');
      expect(chrome.storage.sync.clear).toHaveBeenCalledTimes(1);
    });
  });

  describe('getBytesInUse', () => {
    it('should return bytes in use for local storage', async () => {
      await set('sizeKey', 'hello');
      const bytes = await getBytesInUse();
      expect(chrome.storage.local.getBytesInUse).toHaveBeenCalledWith(null);
      expect(bytes).toBeGreaterThan(0);
    });

    it('should return bytes in use for sync storage', async () => {
      await set('syncSize', 'world', 'sync');
      const bytes = await getBytesInUse(undefined, 'sync');
      expect(chrome.storage.sync.getBytesInUse).toHaveBeenCalledWith(null);
      expect(bytes).toBeGreaterThan(0);
    });

    it('should return bytes in use for specific keys', async () => {
      await set('a', 1);
      await set('b', 2);
      const bytes = await getBytesInUse(['a']);
      expect(chrome.storage.local.getBytesInUse).toHaveBeenCalledWith(['a']);
      expect(bytes).toBeGreaterThan(0);
    });
  });

  describe('SYNC_QUOTA', () => {
    it('should export correct sync quota constants', () => {
      expect(SYNC_QUOTA.QUOTA_BYTES).toBe(102400);
      expect(SYNC_QUOTA.QUOTA_BYTES_PER_ITEM).toBe(8192);
      expect(SYNC_QUOTA.MAX_ITEMS).toBe(512);
      expect(SYNC_QUOTA.MAX_WRITE_OPERATIONS_PER_HOUR).toBe(1800);
      expect(SYNC_QUOTA.MAX_WRITE_OPERATIONS_PER_MINUTE).toBe(120);
    });
  });

  describe('edge cases', () => {
    it('should not fire watch callback for a different key in the same area', () => {
      const callback = vi.fn();
      watch<string>('keyA', callback);

      const listener = (chrome.storage.onChanged.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0];

      // Simulate a change for a different key in the same area
      listener(
        { keyB: { newValue: 'new', oldValue: 'old' } },
        'local'
      );

      expect(callback).not.toHaveBeenCalled();
    });

    it('should get a value from session storage', async () => {
      await set('sessionData', { active: true }, 'session');
      const result = await get<{ active: boolean }>('sessionData', 'session');
      expect(chrome.storage.session.get).toHaveBeenCalledWith('sessionData');
      expect(result).toEqual({ active: true });
    });
  });
});
