"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Crown,
  Loader2,
  Medal,
  Sparkles,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/app/Auth";

type ScorePayload = {
  overall?: number;
  technical_accuracy?: number;
  communication?: number;
  problem_solving?: number;
  strengths?: string[];
  weaknesses?: string[];
  feedback?: string;
  finalScore?: number;
};

type LeaderboardRow = {
  rank: number;
  candidateName: string;
  difficulty: string;
  overall: number;
  presenceScore: number;
  finalScore: number;
  createdAt: string;
};

type InterviewContext = {
  sessionId: string;
  topic: string;
  difficulty?: string;
  duration?: number;
  proctoring?: {
    multiFace?: number;
    suspiciousObject?: number;
  };
  startedAt?: string;
  endedAt?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://virtual-interview-32pw.onrender.com";

const scoreColor = (score: number) => {
  if (score >= 85) return "text-emerald-400";
  if (score >= 70) return "text-cyan-400";
  if (score >= 55) return "text-amber-400";
  return "text-rose-400";
};

const getBadgeTone = (rank: number) => {
  if (rank === 1) return "bg-amber-500/20 text-amber-300 border-amber-400/50";
  if (rank === 2) return "bg-slate-400/20 text-slate-200 border-slate-300/50";
  if (rank === 3) return "bg-orange-500/20 text-orange-300 border-orange-400/50";
  return "bg-white/10 text-zinc-200 border-white/20";
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-3.5 w-3.5 text-amber-300" />;
  if (rank === 2) return <Medal className="h-3.5 w-3.5 text-slate-200" />;
  if (rank === 3) return <Trophy className="h-3.5 w-3.5 text-orange-300" />;
  return null;
};

export default function CongratulationPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScorePayload | null>(null);
  const [presenceScore, setPresenceScore] = useState<number>(65);
  const [context, setContext] = useState<InterviewContext | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      setError(null);

      try {
        const contextRaw = localStorage.getItem("lastInterviewContext");
        const parsedContext = contextRaw
          ? (JSON.parse(contextRaw) as InterviewContext)
          : null;

        if (parsedContext) {
          setContext(parsedContext);
        }

        const presenceRaw = localStorage.getItem("presenceScore");
        const parsedPresence = Number(presenceRaw);
        const safePresence = Number.isFinite(parsedPresence)
          ? Math.max(0, Math.min(100, parsedPresence))
          : 65;
        setPresenceScore(safePresence);

        const cached = localStorage.getItem("interviewScores");
        if (cached) {
          try {
            setScores(JSON.parse(cached));
          } catch {
            // Ignore malformed cache and continue with API call.
          }
        }

        if (!parsedContext?.sessionId) {
          setError("Session details were not found. Complete an interview first to view full analytics.");
          setLoading(false);
          return;
        }

        const candidateName = (user?.username || user?.email?.split("@")[0] || "Candidate").trim();
        const candidateId = user?._id ? String(user._id) : undefined;
        const candidateEmail = user?.email ? String(user.email).trim().toLowerCase() : undefined;
        const evalRes = await fetch(`${API_BASE_URL}/api/evaluate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: parsedContext.sessionId,
            topic: parsedContext.topic || "General",
            difficulty: parsedContext.difficulty || "Medium",
            presenceScore: safePresence,
            candidateName,
            candidateId,
            candidateEmail,
            proctoring: {
              multiFace: Number(parsedContext.proctoring?.multiFace || 0),
              suspiciousObject: Number(parsedContext.proctoring?.suspiciousObject || 0),
            },
          }),
        });

        if (evalRes.ok) {
          const payload = (await evalRes.json()) as ScorePayload;
          setScores(payload);
          localStorage.setItem("interviewScores", JSON.stringify(payload));
        } else if (!cached) {
          setError("Could not evaluate this session right now.");
        }

        if (parsedContext.topic) {
          setLeaderboardLoading(true);
          const lbRes = await fetch(
            `${API_BASE_URL}/api/leaderboard?topic=${encodeURIComponent(parsedContext.topic)}&limit=10`,
          );

          if (lbRes.ok) {
            const lbData = await lbRes.json();
            setLeaderboard(Array.isArray(lbData.leaderboard) ? lbData.leaderboard : []);
          }
        }
      } catch (err) {
        console.error("Failed to load interview summary", err);
        setError("Something went wrong while loading your interview summary.");
      } finally {
        setLeaderboardLoading(false);
        setLoading(false);
      }
    };

    loadResults();
  }, [user]);

  const finalScore = useMemo(() => {
    if (Number.isFinite(scores?.finalScore)) {
      return Math.max(0, Math.min(100, Number(scores?.finalScore)));
    }
    const overall = Number.isFinite(scores?.overall) ? Number(scores?.overall) : 0;
    return Math.round(presenceScore * 0.4 + overall * 0.6);
  }, [presenceScore, scores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b12] flex items-center justify-center text-zinc-200">
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p>Building your interview report...</p>
        </div>
      </div>
    );
  }

  const topicName = context?.topic || "General Interview";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b14] text-zinc-100">
      <div className="pointer-events-none absolute -top-36 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[26rem] w-[26rem] rounded-full bg-amber-500/15 blur-3xl" />

      <section className="container relative mx-auto max-w-7xl px-4 py-10 md:py-14">
        <Card className="mb-8 border-cyan-200/20 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-amber-500/10 p-6 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Interview Completed
              </div>
              <h1 className="text-3xl font-bold leading-tight md:text-5xl">
                Congratulations, your score is
                <span className={`ml-2 ${scoreColor(finalScore)}`}>{finalScore}%</span>
              </h1>
              <p className="mt-3 text-zinc-300">
                Topic: <span className="font-semibold text-white">{topicName}</span>
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-black/30 px-8 py-6 text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Final Composite</p>
              <p className={`mt-2 text-6xl font-black ${scoreColor(finalScore)}`}>{finalScore}</p>
              <p className="mt-1 text-sm text-zinc-400">40% Presence + 60% Answer Quality</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Presence</p>
                <p className={`mt-3 text-4xl font-bold ${scoreColor(presenceScore)}`}>{presenceScore}%</p>
              </Card>
              <Card className="border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Answer Quality</p>
                <p className={`mt-3 text-4xl font-bold ${scoreColor(Number(scores?.overall || 0))}`}>
                  {Number(scores?.overall || 0)}%
                </p>
              </Card>
              <Card className="border-white/10 bg-white/5 p-5 sm:col-span-2 lg:col-span-1">
                <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">Difficulty</p>
                <p className="mt-3 text-2xl font-semibold text-cyan-200">{context?.difficulty || "Medium"}</p>
              </Card>
            </div>

            <Card className="border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Target className="h-5 w-5 text-cyan-300" />
                Skill Breakdown
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-zinc-400">Technical</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-300">{Number(scores?.technical_accuracy || 0)}%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-zinc-400">Communication</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">{Number(scores?.communication || 0)}%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <p className="text-sm text-zinc-400">Problem Solving</p>
                  <p className="mt-2 text-3xl font-bold text-amber-300">{Number(scores?.problem_solving || 0)}%</p>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-emerald-300/20 bg-emerald-500/10 p-6">
                <h3 className="mb-3 text-lg font-semibold text-emerald-200">Strengths</h3>
                {scores?.strengths?.length ? (
                  <ul className="space-y-2 text-sm text-zinc-100">
                    {scores.strengths.slice(0, 5).map((item, idx) => (
                      <li key={`${item}-${idx}`} className="rounded-lg bg-black/20 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-300">Your strengths will appear here once enough answers are evaluated.</p>
                )}
              </Card>

              <Card className="border-amber-300/20 bg-amber-500/10 p-6">
                <h3 className="mb-3 text-lg font-semibold text-amber-200">Improve Next</h3>
                {scores?.weaknesses?.length ? (
                  <ul className="space-y-2 text-sm text-zinc-100">
                    {scores.weaknesses.slice(0, 5).map((item, idx) => (
                      <li key={`${item}-${idx}`} className="rounded-lg bg-black/20 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-300">Practice more interview rounds to get personalized improvement points.</p>
                )}
              </Card>
            </div>

            <Card className="border-white/10 bg-white/5 p-6">
              <h3 className="mb-3 text-lg font-semibold">AI Summary</h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                {scores?.feedback || "Great attempt. Keep practicing to push your score even higher."}
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
                <Trophy className="h-5 w-5 text-amber-300" />
                {topicName} Leaderboard
              </h2>

              {leaderboardLoading ? (
                <p className="text-sm text-zinc-300">Loading leaderboard...</p>
              ) : leaderboard.length === 0 ? (
                <p className="text-sm text-zinc-300">No leaderboard entries yet for this topic. You might be the first one.</p>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={`${entry.rank}-${entry.candidateName}-${entry.createdAt}`}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${getBadgeTone(entry.rank)}`}>
                          #{entry.rank}
                        </span>
                        <div>
                          <p className="flex items-center gap-1 text-sm font-medium text-zinc-100">
                            <User className="h-3.5 w-3.5" />
                            {entry.candidateName}
                            {getRankIcon(entry.rank)}
                          </p>
                          <p className="mt-1 text-xs text-zinc-400">{entry.difficulty}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xl font-bold ${scoreColor(entry.finalScore)}`}>{entry.finalScore}%</p>
                        <p className="text-xs text-zinc-400">Overall {entry.overall}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 text-sm text-zinc-300">
              <p className="mb-2 flex items-center gap-2 font-semibold text-zinc-100">
                <CalendarDays className="h-4 w-4 text-cyan-300" />
                Session Meta
              </p>
              <p>Session: {context?.sessionId ? `${context.sessionId.slice(0, 8)}...` : "N/A"}</p>
              <p>Duration: {context?.duration ? `${context.duration} min` : "N/A"}</p>
            </Card>

            <div className="grid gap-3">
              <Button asChild className="h-12 rounded-xl bg-cyan-500 text-black hover:bg-cyan-400">
                <Link href="/articles">Take Another Interview</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl border-white/30 bg-transparent text-white hover:bg-white/10">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>

            {error ? (
              <Card className="border-rose-300/30 bg-rose-500/10 p-4 text-sm text-rose-200">
                {error}
              </Card>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
