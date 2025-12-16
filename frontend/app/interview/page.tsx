// NO "use client" here!

import { Suspense } from "react";
import InterviewClient from "./InterviewClient";

export default function InterviewPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-purple-50">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <p className="text-2xl font-semibold text-purple-700">Preparing your interview room...</p>
          </div>
        </div>
      }
    >
      <InterviewClient />
    </Suspense>
  );
}