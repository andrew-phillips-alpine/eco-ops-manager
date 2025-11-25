// /app/blocks/communication/error-alert.js
// This block belongs to the Server runtime (shared for alerting)

import { env } from '../../config/env.js';

const errorAlert = {
  init(config = {}) {
    this.config = config;
    return this;
  },

  async run(errorData) {
    const { error, context = '', stack = '' } = errorData;

    const payload = {
      app: env.APP_NAME,
      error: error?.message || error || 'Unknown error',
      context,
      stack: stack || error?.stack || '',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    };

    // Log locally
    console.error(`[ERROR ALERT] ${payload.app}: ${payload.error}`);
    console.error(`Context: ${payload.context}`);
    if (payload.stack) {
      console.error(`Stack: ${payload.stack}`);
    }

    // Skip external alerting in mock mode or if no endpoint
    if (env.USE_MOCK_DATA) {
      console.log('[MOCK MODE] Skipping external error alert');
      return { success: true, mock: true };
    }

    if (!env.FORM_ENDPOINT) {
      console.warn('[ERROR ALERT] No FORM_ENDPOINT configured - skipping external alert');
      return { success: false, reason: 'No FORM_ENDPOINT' };
    }

    // Send to Formspree
    try {
      const response = await fetch(env.FORM_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.error(`[ERROR ALERT] Failed to send alert: ${response.status}`);
        return { success: false, status: response.status };
      }

      return { success: true };
    } catch (alertError) {
      // Don't crash if alerting fails
      console.error('[ERROR ALERT] Failed to send alert:', alertError.message);
      return { success: false, reason: alertError.message };
    }
  },
};

export default errorAlert;

// Convenience function for use in catch blocks
export async function sendErrorAlert(error, context = '') {
  return errorAlert.run({ error, context, stack: error?.stack });
}
