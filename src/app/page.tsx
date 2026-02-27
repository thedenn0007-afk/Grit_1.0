import React from "react";
import Link from "next/link";
import { featureFlags } from "../../config/features";

export default function Page(): JSX.Element {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-slate-50 to-blue-100">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900">Grit Flow</h1>
        <p className="mt-2 text-lg text-slate-600">Learning Platform</p>
        
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Feature Flags:</h2>
          <pre className="mt-2 bg-slate-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(featureFlags, null, 2)}</pre>
        </div>

        <nav className="mt-8 flex flex-wrap gap-4">
          <Link 
            href="/auth/signin" 
            className="px-6 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium"
          >
            Sign In
          </Link>
          <Link 
            href="/modules/dashboard" 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Dashboard
          </Link>
          <Link 
            href="/modules/content" 
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
          >
            Content
          </Link>
          <Link 
            href="/modules/checkpoint" 
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
          >
            Checkpoint
          </Link>
          <Link 
            href="/modules/results" 
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
          >
            Results
          </Link>
        </nav>
      </div>
    </main>
  );
}
