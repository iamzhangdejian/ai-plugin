/**
 * LocalDB - 基于 sql.js + IndexedDB 的文件式本地数据库
 *
 * 架构:
 *   sql.js (SQLite WASM) 提供 SQLite 引擎，数据库文件 (Uint8Array) 持久化到 IndexedDB
 *   这样兼具 SQLite 的 SQL 能力和 IndexedDB 的持久化能力
 */

class LocalDB {
  constructor() {
    this.db = null;
    this._SQL = null;
  }

  /**
   * 初始化数据库
   * 加载 sql.js -> 从 IndexedDB 恢复或新建 -> 创建表
   */
  static async init() {
    const instance = new LocalDB();
    await instance._loadSQL();
    await instance._open();
    await instance._createTables();
    return instance;
  }

  /**
   * 加载 sql.js (CDN)
   */
  async _loadSQL() {
    if (this._SQL) return; // 已加载

    if (typeof initSqlJs !== 'undefined') {
      this._SQL = await initSqlJs({
        locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/${file}`,
      });
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/sql-wasm.js';
      script.onload = async () => {
        try {
          this._SQL = await initSqlJs({
            locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.13.0/${file}`,
          });
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      script.onerror = () => reject(new Error('Failed to load sql.js from CDN'));
      document.head.appendChild(script);
    });
  }

  /**
   * 打开数据库: 从 IndexedDB 恢复或新建
   */
  async _open() {
    const buffer = await this._loadFromIndexedDB();
    if (buffer) {
      try {
        this.db = new this._SQL.Database(buffer);
        return;
      } catch (e) {
        console.warn('[LocalDB] Corrupted database, creating new one:', e);
      }
    }
    this.db = new this._SQL.Database();
  }

  /**
   * 创建 settings 表
   */
  async _createTables() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);
    await this._save();
  }

  /**
   * 将数据库文件保存到 IndexedDB
   */
  _save() {
    const buffer = this.db.export();
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ai-robot-db', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put(buffer, 'main.db');
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从 IndexedDB 加载数据库文件
   */
  _loadFromIndexedDB() {
    return new Promise((resolve) => {
      const request = indexedDB.open('ai-robot-db', 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = (e) => {
        const db = e.target.result;
        if (db.objectStoreNames.contains('files')) {
          const tx = db.transaction('files', 'readonly');
          const storeReq = tx.objectStore('files').get('main.db');
          storeReq.onsuccess = () => resolve(storeReq.result || null);
          storeReq.onerror = () => resolve(null);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  }

  /**
   * 获取值 (自动 JSON 解析)
   */
  get(key) {
    const stmt = this.db.prepare('SELECT value FROM settings WHERE key = ?');
    stmt.bind([key]);
    if (stmt.step()) {
      const raw = stmt.get()[0];
      stmt.free();
      try {
        return JSON.parse(raw);
      } catch {
        return raw; // 非 JSON 值直接返回
      }
    }
    stmt.free();
    return null;
  }

  /**
   * 设置值 (JSON 序列化)
   */
  set(key, value) {
    const now = Date.now();
    const json = JSON.stringify(value);
    this.db.run(`
      INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?
    `, [key, json, now, json, now]);
    this._save();
  }

  /**
   * 删除值
   */
  delete(key) {
    this.db.run('DELETE FROM settings WHERE key = ?', [key]);
    this._save();
  }

  /**
   * 获取所有键
   */
  keys() {
    const results = this.db.exec('SELECT key FROM settings ORDER BY updated_at DESC');
    if (results.length === 0) return [];
    return results[0].values.map(row => row[0]);
  }

  /**
   * 清空所有数据
   */
  clear() {
    this.db.run('DELETE FROM settings');
    this._save();
  }

  /**
   * 查询数据库状态 (用于调试)
   */
  debug() {
    const results = this.db.exec('SELECT key, value, datetime(updated_at/1000, "unixepoch", "localtime") as updated FROM settings');
    if (results.length === 0) return '(empty)';
    return results[0].columns + '\n' + results[0].values.map(r => r.join(' | ')).join('\n');
  }

  /**
   * 关闭数据库连接
   */
  close() {
    this.db.close();
    this.db = null;
  }
}

// 导出到全局 (因为 main.js 是普通 script)
window.LocalDB = LocalDB;
