import { useEffect, useRef } from 'react';
import { socialAuth } from '../services/socialAuth';

export default function GoogleSignInButton({ onSuccess, onError, onLoadingChange, disabled }) {
  const buttonRef = useRef(null);
  const callbacksRef = useRef({ onSuccess, onError, onLoadingChange });

  useEffect(() => {
    callbacksRef.current = { onSuccess, onError, onLoadingChange };
  }, [onSuccess, onError, onLoadingChange]);

  useEffect(() => {
    if (!buttonRef.current) return;

    socialAuth.renderGoogleButton(
      buttonRef.current,
      (data) => callbacksRef.current.onSuccess(data),
      (error) => callbacksRef.current.onError(error),
      (loading) => callbacksRef.current.onLoadingChange(loading),
    );
  }, []);

  return (
    <div
      ref={buttonRef}
      className={`flex justify-center ${disabled ? 'pointer-events-none opacity-60' : ''}`}
      aria-label="Sign in with Google"
    />
  );
}
