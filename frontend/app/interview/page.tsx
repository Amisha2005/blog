"use client";

import InterviewSetupClient from "./setup/InterviewSetupClient";

type InterviewPageProps = {
  searchParams?: {
    topic?: string;
    source?: string;
  };
};

export default function InterviewPage({ searchParams }: InterviewPageProps) {
  return (
    <InterviewSetupClient
      initialTopic={searchParams?.topic ?? ""}
      initialSource={searchParams?.source ?? "admin"}
    />
  );
}
