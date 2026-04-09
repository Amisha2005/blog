import InterviewSetupClient from "./InterviewSetupClient";

type InterviewSetupPageProps = {
  searchParams: Promise<{
    topic?: string;
    source?: string;
  }>;
};

export default async function InterviewSetupPage({ searchParams }: InterviewSetupPageProps) {
  const params = await searchParams;

  return (
    <InterviewSetupClient
      initialTopic={params?.topic ?? ""}
      initialSource={params?.source ?? "custom"}
    />
  );
}
