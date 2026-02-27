'use client';

import Link from 'next/link';

/**
 * Verify Request Page
 * Shown after magic link is sent to email
 */
export default function VerifyRequestPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Check your email
            </h1>
            <p className="text-gray-600 mb-6">
              A sign in link has been sent to your email address. Click the link to sign in to your Grit Flow account.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Don't see it?</strong> Check your spam or junk folder. The link will expire in 24 hours.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/auth/signin"
                className="block w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
              >
                Try another email
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition"
              >
                Go to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
