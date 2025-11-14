/**
 * storage.js - Chrome Storage API wrapper with Promise support
 */

class StorageAPI {
  /**
   * Get value from Chrome storage
   * @param {string|string[]} keys - Key(s) to retrieve
   * @returns {Promise<Object>} - Stored data
   */
  static async get(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        if (Array.isArray(keys)) {
          resolve(result);
        } else {
          resolve(result[keys]);
        }
      });
    });
  }
  
  /**
   * Set value in Chrome storage
   * @param {Object} items - Key-value pairs to store
   * @returns {Promise<void>}
   */
  static async set(items) {
    return new Promise((resolve) => {
      chrome.storage.local.set(items, resolve);
    });
  }
  
  /**
   * Remove value from Chrome storage
   * @param {string|string[]} keys - Key(s) to remove
   * @returns {Promise<void>}
   */
  static async remove(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.remove(keys, resolve);
    });
  }
  
  /**
   * Clear all storage
   * @returns {Promise<void>}
   */
  static async clear() {
    return new Promise((resolve) => {
      chrome.storage.local.clear(resolve);
    });
  }
}
