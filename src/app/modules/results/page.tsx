import React from "react";
import ResultsModule from "../../../modules/results";
import dynamic from "next/dynamic";

/**
 * Results Page
 * 
 * Dynamic import to prevent static generation issues with useSearchParams
 */
export default dynamic(
  () => Promise.resolve(ResultsPage),
  { ssr: false }
);

function ResultsPage(): JSX.Element {
  return <ResultsModule />;
}
