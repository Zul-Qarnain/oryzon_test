"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function FacebookCallbackContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Check if this is a popup (has opener) or a redirect (no opener)
    const isPopup = window.opener !== null;

    if (isPopup) {
      // Desktop popup flow
      if (code) {
        // Send success message to parent window
        window.opener?.postMessage({
          type: 'FACEBOOK_AUTH_SUCCESS',
          code: code
        }, window.location.origin);
      } else if (error) {
        // Send error message to parent window
        window.opener?.postMessage({
          type: 'FACEBOOK_AUTH_ERROR',
          error: error,
          errorDescription: errorDescription
        }, window.location.origin);
      }

      // Close the popup window
      window.close();
    } else {
      // Mobile redirect flow
      if (code || error) {
        // Store the result in localStorage for the main app to pick up
        const authResult = {
          code: code,
          error: error,
          errorDescription: errorDescription
        };
        localStorage.setItem('facebook_auth_result', JSON.stringify(authResult));

        // Redirect back to the original URL
        const returnUrl = localStorage.getItem('facebook_auth_return_url');
        if (returnUrl) {
          localStorage.removeItem('facebook_auth_return_url');
          window.location.href = returnUrl;
        } else {
          // Fallback to home page if no return URL
          window.location.href = '/';
        }
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Processing Facebook Login...</h1>
        <p className="text-[var(--text-on-dark-muted)]">This window will close automatically.</p>
      </div>
    </div>
  );
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-on-dark-primary)] flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-[var(--text-on-dark-muted)]">Processing authentication...</p>
        </div>
      </div>
    }>
      <FacebookCallbackContent />
    </Suspense>
  );
}
