import { Suspense } from "react";
import InterviewRoom from "../interv/page";

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading interview room...</div>}>
      <InterviewRoom />
    </Suspense>
  );
}