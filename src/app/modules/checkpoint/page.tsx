"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CheckpointModule from "../../../modules/checkpoint";

function CheckpointContent(): JSX.Element {
  const searchParams = useSearchParams();
  const subtopicId = searchParams.get("subtopicId");

  if (!subtopicId) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-yellow-800 font-medium">Missing Subtopic</h3>
          <p className="text-yellow-600 text-sm mt-1">
            No subtopic specified. Please access this page from a valid subtopic.
          </p>
        </div>
      </div>
    );
  }

  return <CheckpointModule subtopicId={subtopicId} />;
}

function LoadingFallback() {
  return (
    <div className="p-6 flex items-center justify-center">
      <div className="text-gray-600">Loading checkpoint...</div>
    </div>
  );
}

export default function CheckpointPage(): JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckpointContent />
    </Suspense>
  );
}
