"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, Star, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function CongratulationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 dark:from-slate-950 dark:via-purple-950/30 dark:to-indigo-950/30 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <Card className="overflow-hidden shadow-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
          {/* Header Celebration Section */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white py-16 px-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
            </div>

            <Trophy className="w-24 h-24 mx-auto mb-6 animate-bounce" />
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 drop-shadow-lg">
              Congratulations!
            </h1>
            <p className="text-2xl md:text-3xl font-light opacity-90">
              You&apos;ve Successfully Completed Your AI Interview
            </p>

            <div className="flex justify-center gap-4 mt-10">
              <Sparkles className="w-12 h-12 animate-pulse" />
              <Star className="w-10 h-10 animate-spin-slow" />
              <Sparkles className="w-12 h-12 animate-pulse" />
            </div>
          </div>

          {/* Main Content */}
          <div className="p-10 md:p-16 text-center space-y-10">
            <div className="space-y-6">
              <CheckCircle2 className="w-20 h-20 mx-auto text-green-500" />
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100">
                Well Done! You Made It Through
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                You answered challenging questions with confidence, maintained great presence, and demonstrated strong communication skills. This is exactly what top companies look for.
              </p>
            </div>

           

            <div className="space-y-6">
              <p className="text-lg text-gray-600 dark:text-gray-400 italic">
                “Great job staying calm under pressure and articulating your thoughts clearly. Keep practicing — you’re on the right track!”
              </p>
              <Badge className="px-6 py-3 text-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Sparkles className="mr-2 h-5 w-5" />
                Interview Completed Successfully
                <Sparkles className="ml-2 h-5 w-5" />
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
              <Button
                asChild
                size="lg"
                className="h-16 px-10 text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl transform transition hover:scale-105"
              >
                <Link href="/">
                  <ArrowRight className="mr-3 h-6 w-6" />
                  Back to Home
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-16 px-10 text-xl font-semibold border-2"
              >
                <Link href="/articles">
                  Practice Another Topic
                </Link>
              </Button>
            </div>

            <p className="mt-10 text-sm text-gray-500 dark:text-gray-400">
              Keep going — every interview makes you stronger. You&apos;ve got this! 🚀
            </p>
          </div>
        </Card>
      </div>

      {/* Optional floating confetti effect (visual only in CSS) */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 animate-float">
          <Sparkles className="w-8 h-8 text-yellow-400" />
        </div>
        <div className="absolute top-40 right-20 animate-float delay-300">
          <Star className="w-10 h-10 text-pink-400" />
        </div>
        <div className="absolute bottom-32 left-1/3 animate-float delay-500">
          <Trophy className="w-8 h-8 text-purple-500" />
        </div>
      </div>
    </div>
  );
}