// /app/blocks/communication/logger.js
// This block belongs to the Server runtime (shared for logging)

import { env } from '../../config/env.js';

const logger = {
  init(config = {}) {
    this.config = config;
    this.prefix = config.prefix || env.APP_NAME;
    return this;
  },

  info(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.log(`[${timestamp}] [${this.prefix}] INFO: ${message}`, data);
    } else {
      console.log(`[${timestamp}] [${this.prefix}] INFO: ${message}`);
    }
  },

  warn(message, data = null) {
    const timestamp = new Date().toISOString();
    if (data) {
      console.warn(`[${timestamp}] [${this.prefix}] WARN: ${message}`, data);
    } else {
      console.warn(`[${timestamp}] [${this.prefix}] WARN: ${message}`);
    }
  },

  error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.prefix}] ERROR: ${message}`);
    if (error) {
      console.error(error);
    }
  },

  debug(message, data = null) {
    if (env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      if (data) {
        console.log(`[${timestamp}] [${this.prefix}] DEBUG: ${message}`, data);
      } else {
        console.log(`[${timestamp}] [${this.prefix}] DEBUG: ${message}`);
      }
    }

  },

  mock(endpoint) {
    if (env.USE_MOCK_DATA) {
      console.log(`[MOCK MODE] Serving dummy data for endpoint: ${endpoint}`);
    }
  },
};

export default logger;
