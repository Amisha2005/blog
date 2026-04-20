"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MobileInterviewGuardProps = {
  title?: string;
  description?: string;
};

type MobileBlockState = {
  isReady: boolean;
  isMobileBlocked: boolean;
};

const isLikelyMobileDevice = () => {
  if (typeof window === "undefined") return false;

  const navigatorWithHints = navigator as Navigator & {
    userAgentData?: { mobile?: boolean };
  };

  if (typeof navigatorWithHints.userAgentData?.mobile === "boolean") {
    return navigatorWithHints.userAgentData.mobile;
  }

  const mobileUserAgentPattern =
    /Android.+Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini|Windows Phone/i;

  if (mobileUserAgentPattern.test(navigator.userAgent)) {
    return true;
  }

  // Do not use viewport width for blocking. Responsive desktop/tablet layouts
  // must keep working even on narrow windows.
  return false;
};

export const useInterviewMobileBlock = (): MobileBlockState => {
  const [isReady, setIsReady] = useState(false);
  const [isMobileBlocked, setIsMobileBlocked] = useState(false);

  useEffect(() => {
    setIsMobileBlocked(isLikelyMobileDevice());
    setIsReady(true);
  }, []);

  return { isReady, isMobileBlocked };
};

export default function MobileInterviewGuard({
  title = "Interview Is Not Available On Mobile",
  description = "For camera and proctoring reliability, please use a desktop or laptop browser to set up and take interviews.",
}: MobileInterviewGuardProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 px-4 py-10 dark:from-slate-950 dark:to-purple-950/40">
      <div className="mx-auto max-w-xl">
        <Card className="rounded-3xl border border-gray-200/60 bg-white/90 p-8 text-center shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/70">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">{description}</p>

          <div className="mt-8">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/">Back To Home</Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
