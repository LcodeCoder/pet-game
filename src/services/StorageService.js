export class StorageService {
  constructor(namespace = 'rongrong-paradise') {
    this.namespace = namespace;
    this.memoryFallback = new Map();
  }

  key(name) {
    return `${this.namespace}:${name}`;
  }

  async get(name, fallbackValue) {
    const storageKey = this.key(name);
    try {
      // TODO(Douyin SDK): replace with tt.getStorage({ key: storageKey }) when building for Douyin mini-game.
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(storageKey);
        if (raw == null) return fallbackValue;
        return JSON.parse(raw);
      }
    } catch (error) {
      console.warn('Storage read failed; using fallback', storageKey, error);
    }
    return this.memoryFallback.has(storageKey) ? this.memoryFallback.get(storageKey) : fallbackValue;
  }

  async set(name, value) {
    const storageKey = this.key(name);
    try {
      // TODO(Douyin SDK): replace with tt.setStorage({ key: storageKey, data: value }) when building for Douyin mini-game.
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(value));
        return true;
      }
    } catch (error) {
      console.warn('Storage write failed; using memory fallback', storageKey, error);
    }
    this.memoryFallback.set(storageKey, value);
    return false;
  }
}
