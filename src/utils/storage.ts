/**
 * 存储工具 - LocalStorage 封装
 */

export interface StorageOptions {
  prefix?: string;
  encrypt?: boolean;
}

/**
 * 本地存储管理类
 */
export class Storage {
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? 'ai-robot:';
  }

  /**
   * 生成完整的 key
   */
  private makeKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * 获取值
   */
  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.makeKey(key);
      const item = localStorage.getItem(fullKey);

      if (item === null) {
        return defaultValue ?? null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error('[Storage] Get error:', error);
      return defaultValue ?? null;
    }
  }

  /**
   * 设置值
   */
  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.makeKey(key);
      localStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Storage] Set error:', error);
      return false;
    }
  }

  /**
   * 删除值
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.makeKey(key);
      localStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('[Storage] Remove error:', error);
      return false;
    }
  }

  /**
   * 清空所有
   */
  clear(): boolean {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(this.prefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('[Storage] Clear error:', error);
      return false;
    }
  }

  /**
   * 检查是否存在
   */
  has(key: string): boolean {
    const fullKey = this.makeKey(key);
    return localStorage.getItem(fullKey) !== null;
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(this.prefix, ''));
  }

  /**
   * 获取所有值
   */
  all<T>(): Record<string, T> {
    const result: Record<string, T> = {};
    this.keys().forEach(key => {
      const value = this.get<T>(key);
      if (value !== null) {
        result[key] = value;
      }
    });
    return result;
  }
}

/**
 * 会话存储类
 */
export class SessionStorage {
  private prefix: string;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? 'ai-robot:';
  }

  private makeKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const fullKey = this.makeKey(key);
      const item = sessionStorage.getItem(fullKey);

      if (item === null) {
        return defaultValue ?? null;
      }

      return JSON.parse(item) as T;
    } catch (error) {
      console.error('[SessionStorage] Get error:', error);
      return defaultValue ?? null;
    }
  }

  set<T>(key: string, value: T): boolean {
    try {
      const fullKey = this.makeKey(key);
      sessionStorage.setItem(fullKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[SessionStorage] Set error:', error);
      return false;
    }
  }

  remove(key: string): boolean {
    try {
      const fullKey = this.makeKey(key);
      sessionStorage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('[SessionStorage] Remove error:', error);
      return false;
    }
  }

  clear(): boolean {
    try {
      const keys = Object.keys(sessionStorage).filter(key =>
        key.startsWith(this.prefix)
      );
      keys.forEach(key => sessionStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('[SessionStorage] Clear error:', error);
      return false;
    }
  }

  has(key: string): boolean {
    const fullKey = this.makeKey(key);
    return sessionStorage.getItem(fullKey) !== null;
  }
}

// 导出默认实例
export const localStorageInstance = new Storage();
export const sessionStorageInstance = new SessionStorage();

/**
 * 存储键名常量
 */
export const StorageKeys = {
  CONFIG: 'config',
  HISTORY: 'history',
  POSITION: 'position',
  THEME: 'theme',
  PREFERENCES: 'preferences',
} as const;
