"use client";

import { useSearchParams } from "next/navigation";
import InterviewRoom from "./InterviewRoom";

export default function InterviewClient() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic"); // Extract the topic from URL

  // Pass the topic down to your main InterviewRoom component
  // This way, InterviewRoom can use it without calling useSearchParams() itself
  return <InterviewRoom selectedTopic={topic} />;
}