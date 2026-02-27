'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

/**
 * Auth Error Page
 * Displays authentication errors
 */
export default function AuthErrorPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ErrorContent />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-gray-600">Loading...</div>
    </div>
  );
}

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    OAuthSignin: 'There was an error signing in with the provider.',
    OAuthCallback: 'There was an error in the OAuth callback. Please try again.',
    OAuthCreateAccount: 'Unable to create account with the provider.',
    EmailCreateAccount: 'Unable to create account with email.',
    Callback: 'There was an error with the callback URL.',
    OAuthAccounts: 'This email is associated with another OAuth provider.',
    SessionCallback: 'There was an error with the session callback.',
    CredentialsSignin: 'Sign in failed. Check your credentials.',
    default: 'An authentication error occurred. Please try again.',
  };

  const message = error && errorMessages[error] ? errorMessages[error] : errorMessages.default;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Error
            </h1>
            <p className="text-gray-600 mb-6">
              {message}
            </p>

            {error && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                <p className="text-xs text-gray-600 font-mono">
                  Error code: {error}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
              >
                Try signing in again
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Go to home
              </Link>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
