"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type InterviewSetupClientProps = {
  initialTopic: string;
  initialSource: string;
};

type PdfJsModule = {
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument: (options: { data: ArrayBuffer }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{
          items: Array<{ str?: string }>;
        }>;
      }>;
    }>;
  };
};

let pdfjsLibPromise: Promise<PdfJsModule> | null = null;

const loadPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((lib) => {
      const typedLib = lib as unknown as PdfJsModule;
      typedLib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/legacy/build/pdf.worker.min.mjs";
      return typedLib;
    });
  }

  return pdfjsLibPromise;
};

export default function InterviewSetupClient({
  initialTopic,
  initialSource,
}: InterviewSetupClientProps) {
  const router = useRouter();

  const topicSource: "demo" | "admin" = initialSource === "demo" ? "demo" : "admin";

  const topicSourceLabel =
    topicSource === "demo"
      ? "Demo Topic"
      : "Admin Added Topic";

  const [topic, setTopic] = useState(initialTopic ? decodeURIComponent(initialTopic) : "");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard" | "">("");
  const [duration, setDuration] = useState<number | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const canStart = useMemo(
    () => !!topic.trim() && !!difficulty && !!duration && !isParsing,
    [topic, difficulty, duration, isParsing],
  );

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);

    try {
      const pdfjsLib = await loadPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item) => item.str || "").join(" ");
        fullText += `${pageText}\n\n`;
      }

      fullText = fullText
        .replace(/mediaimage.*?}/g, "")
        .replace(/�/g, "•")
        .replace(/\s+/g, " ")
        .trim();

      setResumeText(fullText);
    } catch (error) {
      console.error("Resume parsing failed", error);
      alert("Resume parsing failed. Please try another PDF.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleStart = () => {
    if (!canStart) return;

    const setupPayload = {
      topic: topic.trim(),
      difficulty,
      duration,
      resumeText,
    };

    sessionStorage.setItem("interviewSetup", JSON.stringify(setupPayload));

    const params = new URLSearchParams({
      topic: topic.trim(),
      difficulty,
      duration: String(duration),
      autostart: "1",
    });

    router.push(`/interview/room?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/40">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="rounded-3xl border border-gray-200/60 bg-white/90 p-8 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/70 md:p-10">
          <h1 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
            Set Up Your Interview
          </h1>
          <p className="mt-3 text-center text-muted-foreground">
            Configure the interview once, then continue to the live room.
          </p>

          <div className="mt-10 grid gap-7 md:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-base font-medium">Topic</label>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    topicSource === "demo"
                      ? "bg-blue-100 text-blue-700"
                      : topicSource === "admin"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {topicSourceLabel}
                </span>
              </div>
              <Textarea
                value={topic}
                readOnly
                placeholder="e.g. React Hooks, Node.js APIs, System Design"
                className="min-h-24 resize-none"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Topic is selected from Demo or Admin-added topics and cannot be edited here.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-base font-medium">Upload Resume (Optional PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="block h-12 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-200"
              />

              {isParsing && <p className="mt-2 text-sm text-purple-600">Parsing resume...</p>}
              {!!resumeText && (
                <p className="mt-2 text-sm text-green-600">
                  Resume loaded ({(resumeText.length / 1000).toFixed(1)} k chars)
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-base font-medium">Difficulty</label>
              <Select value={difficulty || undefined} onValueChange={(v) => setDifficulty(v as "Easy" | "Medium" | "Hard")}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-2 block text-base font-medium">Duration</label>
              <Select value={duration ? String(duration) : undefined} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choose duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Button
              type="button"
              size="lg"
              className="group relative h-14 w-full rounded-2xl border border-sky-400/40 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-8 text-base font-semibold tracking-wide text-white shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[240px] sm:px-10"
              onClick={handleStart}
              disabled={!canStart}
            >
              <span className="absolute inset-0 rounded-2xl bg-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:bg-white/10" />
              <span className="relative">Start Interview</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
