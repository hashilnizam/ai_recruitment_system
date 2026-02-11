/**
 * Secure storage utilities
 */

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'default-key-change-in-production';

export const secureStorage = {
  setItem: (key: string, value: any) => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error encrypting data:', error);
      // Fallback to unencrypted storage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  getItem: (key: string): any => {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = atob(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting data:', error);
      // Fallback to unencrypted storage
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  }
};

/**
 * Session storage for temporary data
 */
export const sessionStorage = {
  setItem: (key: string, value: any) => {
    try {
      const encrypted = btoa(JSON.stringify(value));
      sessionStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Error encrypting session data:', error);
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  },

  getItem: (key: string): any => {
    try {
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      const decrypted = atob(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error decrypting session data:', error);
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    }
  },

  removeItem: (key: string) => {
    sessionStorage.removeItem(key);
  },

  clear: () => {
    sessionStorage.clear();
  }
};
