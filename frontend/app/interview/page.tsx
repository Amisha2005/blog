import { redirect } from "next/navigation";

type InterviewPageProps = {
  searchParams: Promise<{
    topic?: string;
    source?: string;
  }>;
};

export default async function InterviewPage({ searchParams }: InterviewPageProps) {
  const paramsObj = await searchParams;
  const topic = paramsObj?.topic;
  const source = paramsObj?.source;

  if (topic) {
    const params = new URLSearchParams({
      topic,
      ...(source ? { source } : {}),
    });
    redirect(`/interview/setup?${params.toString()}`);
  }

  redirect("/interview/setup");
}