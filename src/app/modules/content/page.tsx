import React, { Suspense } from "react";
import ContentModule from "../../../modules/content";

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-600">Loading content...</div>
    </div>
  );
}

export default function ContentPage(): JSX.Element {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ContentModule />
    </Suspense>
  );
}
