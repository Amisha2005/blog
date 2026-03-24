"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function CongratulationPage() {
  const [scores, setScores] = useState<any>(null);
  const [presenceScore, setPresenceScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("📄 Congratulations Page Loaded - Reading localStorage");

    // Load AI Scores
    const savedScores = localStorage.getItem("interviewScores");
    if (savedScores) {
      try {
        const parsed = JSON.parse(savedScores);
        console.log("✅ Loaded AI Scores:", parsed);
        setScores(parsed);
      } catch (e) {
        console.error("Failed to parse interviewScores:", e);
      }
    } else {
      console.warn("⚠️ No 'interviewScores' found in localStorage");
    }

    // Load Presence Score
    const savedPresence = localStorage.getItem("presenceScore");
    if (savedPresence) {
      const num = Number(savedPresence);
      if (!isNaN(num)) {
        console.log("✅ Loaded Presence Score:", num);
        setPresenceScore(num);
      }
    } else {
      console.warn("⚠️ No 'presenceScore' found in localStorage");
    }

    setLoading(false);
  }, []);

  // Calculate Final Score safely
  const finalScore = useMemo(() => {
    const presence = presenceScore ?? 65;
    const aiOverall = scores?.overall ?? 0;        // default 0 instead of 70 when missing

    const combined = Math.round(presence * 0.4 + aiOverall * 0.6);
    return Math.min(99, Math.max(0, combined));
  }, [presenceScore, scores]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400 text-xl">Loading your results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-zinc-700 rounded-3xl p-10 text-center">
        <Trophy className="w-20 h-20 mx-auto text-yellow-400 mb-6" />

        <h1 className="text-5xl font-bold text-white">Congratulations!</h1>
        <p className="text-zinc-400 mt-2">Your interview is complete</p>

        {/* Main Final Score */}
        <div className="my-12">
          <p className="text-zinc-400 text-lg mb-3">YOUR FINAL SCORE</p>
          <div className="text-8xl font-black text-yellow-400">
            {finalScore}<span className="text-5xl">%</span>
          </div>
          <p className="text-sm text-zinc-500 mt-2">
            40% Presence + 60% Answer Quality
          </p>
        </div>

        {/* Breakdown Cards */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="bg-zinc-800 p-6 rounded-xl">
            <p className="text-5xl font-bold text-yellow-400">
              {presenceScore ?? "?"}%
            </p>
            <p className="text-zinc-400 mt-2">Presence & Confidence</p>
          </div>

          <div className="bg-zinc-800 p-6 rounded-xl">
            <p className="text-5xl font-bold text-white">
              {scores?.overall ?? "?"}%
            </p>
            <p className="text-zinc-400 mt-2">Answer Quality</p>
            <p className="text-xs text-zinc-500">(Technical + Communication)</p>
          </div>
        </div>

        {scores ? (
          <>
            {scores.strengths?.length > 0 && (
              <div className="mb-8 text-left">
                <h3 className="text-xl font-semibold text-green-400 mb-3">Strengths</h3>
                <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                  {scores.strengths.map((s: string, i: number) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {scores.weaknesses?.length > 0 && (
              <div className="mb-8 text-left">
                <h3 className="text-xl font-semibold text-red-400 mb-3">Areas to Improve</h3>
                <ul className="list-disc pl-6 space-y-2 text-zinc-300">
                  {scores.weaknesses.map((w: string, i: number) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="text-zinc-300 text-lg italic px-4 mb-10">
              {scores.feedback || "Good effort! Keep practicing."}
            </p>
          </>
        ) : (
          <div className="bg-red-950/50 border border-red-500/30 rounded-2xl p-6 mb-8">
            <p className="text-red-400">
              ⚠️ AI Evaluation could not be loaded.<br />
              Only Presence score is available.
            </p>
            <p className="text-xs text-zinc-500 mt-3">
              (Check browser console for details)
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200">
            <Link href="/">Start New Interview</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-zinc-700 text-white hover:bg-zinc-800">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}