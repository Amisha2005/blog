"use client";

import { useSearchParams } from "next/navigation";
import InterviewRoom from "./InterviewRoom";
import MobileInterviewGuard, {
  useInterviewMobileBlock,
} from "./MobileInterviewGuard";

export default function InterviewClient() {
  const searchParams = useSearchParams();
  const { isReady, isMobileBlocked } = useInterviewMobileBlock();
  const topic = searchParams.get("topic"); // Extract the topic from URL

  if (!isReady) {
    return null;
  }

  if (isMobileBlocked) {
    return (
      <MobileInterviewGuard title="Interview Room Is Disabled On Mobile" />
    );
  }

  // Pass the topic down to your main InterviewRoom component
  // This way, InterviewRoom can use it without calling useSearchParams() itself
  return <InterviewRoom selectedTopic={topic} />;
}