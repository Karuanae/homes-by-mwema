// src/services/socialAuth.js
import { authAPI } from './api';

class SocialAuthService {
  constructor() {
    this.googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    this.isScriptLoaded = false;
    this._scriptPromise = null;
  }

  /**
   * Load Google Identity Services script (singleton promise — safe to call multiple times)
   */
  loadGoogleScript() {
    if (this._scriptPromise) return this._scriptPromise;

    if (window.google?.accounts?.id) {
      this.isScriptLoaded = true;
      return (this._scriptPromise = Promise.resolve());
    }

    this._scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        this.isScriptLoaded = true;
        resolve();
      };
      script.onerror = () => {
        this._scriptPromise = null; // allow retry
        reject(new Error('Failed to load Google Sign-In script'));
      };
      document.body.appendChild(script);
    });

    return this._scriptPromise;
  }

  /**
   * Send Google credential to your backend and store the returned token
   * Returns: { user, token }
   */
  async handleGoogleCredential(credential) {
    if (!credential) {
      throw new Error('Google did not return a sign-in credential. Please try again.');
    }

    try {
      const response = await authAPI.googleAuth(credential);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.error
        || err.response?.data?.message
        || (err.request
          ? 'Could not reach the sign-in server. Check your connection and try again.'
          : err.message)
        || 'Google authentication failed. Please try again.';
      throw new Error(message, { cause: err });
    }
  }

  /**
   * Render Google's explicit sign-in button.
   * onSuccess(data) receives { user, token } from your backend.
   * onError(err) receives an Error object.
   */
  async renderGoogleButton(element, onSuccess, onError, onLoadingChange = () => {}) {
    try {
      await this.loadGoogleScript();

      if (!this.googleClientId) {
        throw new Error('VITE_GOOGLE_CLIENT_ID is not set');
      }

      if (!window.google?.accounts?.id?.renderButton) {
        throw new Error('Google Sign-In is unavailable. Please try again later.');
      }

      element.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: this.googleClientId,
        callback: async (googleResponse) => {
          onLoadingChange(true);
          try {
            const data = await this.handleGoogleCredential(googleResponse.credential);
            onSuccess(data);
          } catch (err) {
            onError(err);
          } finally {
            onLoadingChange(false);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(element, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(element.clientWidth || 400, 400),
      });
    } catch (err) {
      onError(err);
    }
  }

  /**
   * Disable Google auto-select on logout
   */
  signOut() {
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  }
}

export const socialAuth = new SocialAuthService();
export default socialAuth;