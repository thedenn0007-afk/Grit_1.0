/**
 * Dashboard Module
 * 
 * Main dashboard page with:
 * - Resume banner (if in-progress content exists)
 * - Topic grid (free topic choice with progress badges)
 * - Linear progression enforcement for subtopics within each topic
 * 
 * Uses new dashboard API router with:
 * - getTopics: returns all topics with progress percentage (0%, 50%, 100%)
 * - getResumePoint: returns resume point if user has in-progress content
 */

import React from "react";
import TopicGrid from "./components/TopicGrid";
import ResumeBanner from "./components/ResumeBanner";

export default function DashboardModule(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Learning Dashboard</h1>
          <p className="mt-2 text-slate-600">Choose a topic to start learning</p>
        </div>

        {/* Resume Banner - Shows when there's in-progress content */}
        <ResumeBanner />

        {/* Topic Grid - All topics with progress badges */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-6">Available Topics</h2>
          <TopicGrid />
        </div>

        {/* Linear Progression Notice */}
        <div className="mt-12 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium text-blue-900">Linear Progression</p>
              <p className="text-sm text-blue-700 mt-1">
                Complete each subtopic with a score of 70% or higher to unlock the next one.
                You cannot skip ahead - each checkpoint builds on the previous knowledge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
