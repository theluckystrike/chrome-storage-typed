// Chrome API mock setup for testing
// Uses a minimal mock that covers storage, runtime, tabs, alarms
// Add more API mocks here as needed

const createStorageArea = () => {
  const store: Record<string, unknown> = {};
  return {
    get: vi.fn((keys: string | string[]) => {
      if (typeof keys === 'string') return Promise.resolve({ [keys]: store[keys] });
      const result: Record<string, unknown> = {};
      (Array.isArray(keys) ? keys : [keys]).forEach(k => { result[k] = store[k]; });
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, unknown>) => {
      Object.assign(store, items);
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[]) => {
      (Array.isArray(keys) ? keys : [keys]).forEach(k => delete store[k]);
      return Promise.resolve();
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(k => delete store[k]);
      return Promise.resolve();
    }),
    _store: store,
  };
};

const chromeMock = {
  storage: {
    local: createStorageArea(),
    sync: createStorageArea(),
    session: createStorageArea(),
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
  },
  runtime: {
    sendMessage: vi.fn(() => Promise.resolve()),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      hasListener: vi.fn(() => false),
    },
    getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
    id: 'mock-extension-id',
    lastError: null as chrome.runtime.LastError | null,
  },
  tabs: {
    query: vi.fn(() => Promise.resolve([])),
    create: vi.fn(() => Promise.resolve({ id: 1 })),
    update: vi.fn(() => Promise.resolve({})),
    remove: vi.fn(() => Promise.resolve()),
    sendMessage: vi.fn(() => Promise.resolve()),
    onUpdated: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  alarms: {
    create: vi.fn(() => Promise.resolve()),
    get: vi.fn(() => Promise.resolve(null)),
    getAll: vi.fn(() => Promise.resolve([])),
    clear: vi.fn(() => Promise.resolve(true)),
    clearAll: vi.fn(() => Promise.resolve(true)),
    onAlarm: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  contextMenus: {
    create: vi.fn(() => 'mock-menu-id'),
    update: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
    removeAll: vi.fn(() => Promise.resolve()),
    onClicked: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  notifications: {
    create: vi.fn((_id: string, _opts: unknown) => Promise.resolve('mock-notif-id')),
    clear: vi.fn(() => Promise.resolve(true)),
    onClicked: { addListener: vi.fn(), removeListener: vi.fn() },
  },
  permissions: {
    request: vi.fn(() => Promise.resolve(true)),
    remove: vi.fn(() => Promise.resolve(true)),
    contains: vi.fn(() => Promise.resolve(false)),
    getAll: vi.fn(() => Promise.resolve({ permissions: [], origins: [] })),
    onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
    onRemoved: { addListener: vi.fn(), removeListener: vi.fn() },
  },
};

// Install globally
Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
  configurable: true,
});

// Helper to reset all mocks between tests
export function resetChromeMocks(): void {
  vi.clearAllMocks();
  chromeMock.storage.local._store && Object.keys(chromeMock.storage.local._store).forEach(k => delete (chromeMock.storage.local._store as Record<string, unknown>)[k]);
  chromeMock.storage.sync._store && Object.keys(chromeMock.storage.sync._store).forEach(k => delete (chromeMock.storage.sync._store as Record<string, unknown>)[k]);
}
