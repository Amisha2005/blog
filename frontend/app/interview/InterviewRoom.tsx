"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from "face-api.js";
//fileSetResolver used to create enviroment for working of objectdetector in browser
import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Send,
  Bot,
  Video,
  VideoOff,
  MoveRight,
  Sparkles,
  TerminalSquare,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
//useSearchParams used to get value from url such as we are taking topic
import { useSearchParams } from "next/navigation";

let pdfjsLibPromise: Promise<any> | null = null;

const loadPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc =
        "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/legacy/build/pdf.worker.min.mjs";
      return lib;
    });
  }

  return pdfjsLibPromise;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

interface Message {
  text: string;
  isBot: boolean;
}

interface InterviewRoomProps {
  selectedTopic: string | null;
}
//objectDtector where object are store initially it will be null

let objectDetector: ObjectDetector | null = null;

export default function InterviewRoom({ selectedTopic }: InterviewRoomProps) {
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get("difficulty");
  const durationParam = searchParams.get("duration");
  const autoStartParam = searchParams.get("autostart");
  const cleanTopic = selectedTopic ? decodeURIComponent(selectedTopic) : null;
  const [autoStartRequested, setAutoStartRequested] = useState(false);
  const [skipSetupScreen, setSkipSetupScreen] = useState(false);
  // New state
  const [resumeText, setResumeText] = useState<string>("");
  const [isParsing, setIsParsing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [interviewStarted, setInterviewStarted] = useState<boolean>(false);
  const [interviewEnded, setInterviewEnded] = useState<boolean>(false);
  //set value is ignore means you don't hav e to change the value later and crypto.randomUUID() is used to generate random unique id for each interview session which will be used in backend to identify the session and store the data related to that session
  const [sessionId] = useState<string>(crypto.randomUUID());

  // Timer states
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Selection states
  const [showDifficulty, setShowDifficulty] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "Easy" | "Medium" | "Hard" | null
  >(null);
  const [showDuration, setShowDuration] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null); // minutes
  const [manualTopic, setManualTopic] = useState("");

  // Camera & Media states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeCheckResult, setCodeCheckResult] = useState<{
    status: "idle" | "ok" | "warn" | "error";
    message: string;
  }>({ status: "idle", message: "" });
  const [aiCheckLoading, setAiCheckLoading] = useState(false);
  const [aiCodeResult, setAiCodeResult] = useState<{
    summary: string;
    issues: string[];
    correctedCode: string;
    expectedOutput: string;
    confidence: string;
  } | null>(null);

  // Emotion & Object detection
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [emotionSamples, setEmotionSamples] = useState<
    { smile: number; stress: number; conf: number; timestamp: number }[]
  >([]);
  const [showInstructions, setShowInstructions] = useState<boolean>(true);
  const [smileScore, setSmileScore] = useState<number>(0);
  const [stressScore, setStressScore] = useState<number>(0);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [customTopic, setCustomTopic] = useState<string | null>(null);
  const [facesDetected, setFacesDetected] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showMultiFaceModal, setShowMultiFaceModal] = useState<boolean>(false);
  const [showSuspiciousObjectModal, setShowSuspiciousObjectModal] =
    useState<boolean>(false);
  const [suspiciousObjectsList, setSuspiciousObjectsList] = useState<string[]>(
    [],
  );
  const lastObjectAlertTimeRef = useRef<number>(0);
  const OBJECT_ALERT_COOLDOWN_MS = 10000;

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const hasEndedRef = useRef(false);
  const timerActiveRef = useRef(false);

  const currentTimeRef = useRef<number | null>(null);

  const startInterviewTimer = (seconds: number) => {
    console.log("[TIMER] Starting with", seconds, "seconds");

    setTimeLeft(seconds);
    currentTimeRef.current = seconds;
    setIsTimerRunning(true);
    hasEndedRef.current = false;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (hasEndedRef.current || currentTimeRef.current === null) return;

      const next = currentTimeRef.current - 1;
      currentTimeRef.current = next;
      setTimeLeft(next);

      if (next <= 0) {
        hasEndedRef.current = true;
        clearInterval(timerRef.current!);
        timerRef.current = null;

        console.log("⏰ Time's up - Ending interview");
        persistInterviewContext();
        setInterviewEnded(true);
        stopCamera();

        setMessages((prev) => [
          ...prev,
          { text: "⌛ Time's up! Interview ended automatically.", isBot: true },
        ]);

        // Direct redirect to congratulations page
        setTimeout(() => {
          window.location.href = "/congratulations";
        }, 1500);
      }
    }, 1000);
  };
  // Stop/pause timer
  const pauseTimer = () => {
    console.log("[TIMER] Pausing");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTimerRunning(false);
  };

  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, seconds); // never negative
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ────────────────────────────────────────────────
  //  Camera Control
  // ────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        // Important: wait for 'loadedmetadata' before play
        videoRef.current.onloadedmetadata = () => {
          //This code is used to start playing the camera video only after the video metadata is loaded. 📷 by the browser then the camera vedio start playing
          videoRef.current?.play().catch((err) => {
            console.error("Auto-play failed:", err);
            setCameraError("Video play failed - please click anywhere on page");
          });
        };
      }

      streamRef.current = stream;
      //This line stores the camera/media stream inside a useRef reference variable.
      setCameraActive(true);
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (err: any) {
      let msg = "Camera/Mic access failed";
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError"
      ) {
        msg =
          "Camera and microphone permission denied. Please allow access in browser settings.";
      } else if (err.name === "NotFoundError") {
        msg = "No camera or microphone found on this device.";
      } else if (err.name === "NotReadableError") {
        msg = "Camera is in use by another application.";
      }
      console.error("getUserMedia error:", err);
      setCameraError(msg);
      setMessages((prev) => [...prev, { text: msg, isBot: true }]);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const toggleCamera = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  // ────────────────────────────────────────────────
  //  Models Loading
  // ────────────────────────────────────────────────
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL =
          "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights/";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setIsModelReady(true);
      } catch (err) {
        console.error("face-api models failed", err);
        setMessages((p) => [
          ...p,
          { text: "Emotion detection unavailable.", isBot: true },
        ]);
      }
    };
    loadModels();

    // MediaPipe Object Detector
    (async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
        );
        //FilesetResolver loads the WebAssembly runtime files required for MediaPipe Vision.
        objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite2/float16/latest/efficientdet_lite2.tflite",
            delegate: "CPU",
          },
          //GPU stands for Graphics Processing Unit. 🖥️

          // A GPU is a processor designed to handle many calculations at the same time, especially for graphics and heavy computations like AI and machine learning.
          //modelAssetPath This loads the trained object detection model file.
          scoreThreshold: 0.18,
          maxResults: 10,
          runningMode: "VIDEO",
        });
      } catch (e) {
        console.error("Object detector init failed", e);
      }
    })();

    return () => {
      objectDetector?.close();
    };
  }, []);

  // ────────────────────────────────────────────────
  //  Emotion & Face Detection Loop
  // ────────────────────────────────────────────────
  //useCallback is a React Hook used to memoize (remember) a function so that it is not recreated on every render. 🔁
  const detectEmotions = useCallback(async () => {
    if (!videoRef.current || !cameraActive || interviewEnded || !isModelReady) {
      requestAnimationFrame(detectEmotions);
      return;
    }
    const video = videoRef.current;
    if (video.paused || video.ended || video.videoWidth === 0) {
      requestAnimationFrame(detectEmotions);
      return;
    }

    try {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();

      setFacesDetected(detections.length);

      if (detections.length > 1) {
        setIsPaused(true);
        setShowMultiFaceModal(true);
      } else if (detections.length === 1) {
        const expr = detections[0].expressions;
        const smile = Math.round((expr.happy || 0) * 100);
        const stressRaw =
          (expr.angry || 0) +
          (expr.sad || 0) +
          (expr.fearful || 0) +
          (expr.disgusted || 0);
        const stress = Math.round(stressRaw * 25);
        const conf = Math.round((expr.neutral || 0) * 100 - stress * 0.4);

        setSmileScore(smile);
        setStressScore(stress);
        setConfidenceScore(conf);

        setEmotionSamples((prev) => [
          ...prev,
          { smile, stress, conf, timestamp: Date.now() },
        ]);
      } else {
        setSmileScore(0);
        setStressScore(0);
        setConfidenceScore(30);
      }
    } catch (err) {
      console.error("Emotion detection error", err);
    }

    requestAnimationFrame(detectEmotions);
  }, [cameraActive, interviewEnded, isModelReady]);

  const calculateFinalPresenceScore = () => {
    if (emotionSamples.length === 0) {
      return 65; // Neutral default (not too low)
    }

    // Take last 70% of samples to ignore initial nervousness
    const relevantSamples = emotionSamples.slice(
      Math.floor(emotionSamples.length * 0.3),
    );

    const avgSmile =
      relevantSamples.reduce((sum, s) => sum + s.smile, 0) /
      relevantSamples.length;
    const avgStress =
      relevantSamples.reduce((sum, s) => sum + s.stress, 0) /
      relevantSamples.length;
    const avgConfidence =
      relevantSamples.reduce((sum, s) => sum + s.conf, 0) /
      relevantSamples.length;

    // Simple weighted formula (you can tweak weights easily)
    const presenceScore = Math.round(
      avgSmile * 0.45 + (100 - avgStress) * 0.35 + avgConfidence * 0.2,
    );

    // Clamp between 30 and 98
    return Math.max(30, Math.min(98, presenceScore));
  };

  const persistInterviewContext = useCallback(() => {
    const activeTopic = cleanTopic || customTopic || manualTopic.trim() || "General";
    const presence = calculateFinalPresenceScore();

    localStorage.setItem("presenceScore", String(presence));
    localStorage.setItem(
      "lastInterviewContext",
      JSON.stringify({
        sessionId,
        topic: activeTopic,
        difficulty: selectedDifficulty || "Medium",
        duration: selectedDuration,
        endedAt: new Date().toISOString(),
      }),
    );
  }, [cleanTopic, customTopic, manualTopic, selectedDifficulty, selectedDuration, sessionId, emotionSamples]);

  useEffect(() => {
    if (cameraActive && isModelReady) detectEmotions();
  }, [cameraActive, isModelReady, detectEmotions]);

  // ────────────────────────────────────────────────
  //  Object Detection (cheating prevention)
  // ────────────────────────────────────────────────
  const detectObjects = useCallback(async () => {
    if (
      !videoRef.current ||
      !objectDetector ||
      !cameraActive ||
      interviewEnded
    ) {
      requestAnimationFrame(detectObjects);
      return;
    }

    try {
      const results = await objectDetector.detectForVideo(
        videoRef.current,
        performance.now(),
      );
      const suspicious = results.detections.filter((d) => {
        const label = (d.categories[0]?.categoryName || "").toLowerCase();
        return (
          [
            "cell phone",
            "mobile phone",
            "smartphone",
            "book",
            "laptop",
          ].includes(label) && (d.categories[0]?.score ?? 0) > 0.22
        );
      });

      if (suspicious.length > 0 && !isPaused) {
        const now = Date.now();
        if (now - lastObjectAlertTimeRef.current > OBJECT_ALERT_COOLDOWN_MS) {
          const labels = [
            ...new Set(
              suspicious.map((d) => d.categories[0]?.categoryName || "unknown"),
            ),
          ];
          setSuspiciousObjectsList(labels);
          setShowSuspiciousObjectModal(true);
          setIsPaused(true);
          setMessages((p) => [
            ...p,
            {
              text: `Suspicious object(s) detected: ${labels.join(", ")}. Please remove them.`,
              isBot: true,
            },
          ]);
          lastObjectAlertTimeRef.current = now;
        }
      }
    } catch (err) {
      console.error("Object detection error", err);
    }

    requestAnimationFrame(detectObjects);
  }, [cameraActive, interviewEnded]);

  useEffect(() => {
    if (cameraActive) detectObjects();
  }, [cameraActive, detectObjects]);

  // ────────────────────────────────────────────────
  //  Pause / Resume logic
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) {
      pauseTimer();
    } else if (timeLeft != null && timeLeft > 0 && !isTimerRunning) {

    }
  }, [isPaused]);

  // ────────────────────────────────────────────────
  //  Initial message when topic is passed via props
  // ────────────────────────────────────────────────

  useEffect(() => {
    if (cleanTopic) {
      setShowInstructions(true); // Show instructions when topic is loaded
    }
  }, [cleanTopic]);

  useEffect(() => {
    if (!difficultyParam && !durationParam && autoStartParam !== "1") return;

    if (difficultyParam && ["Easy", "Medium", "Hard"].includes(difficultyParam)) {
      setSelectedDifficulty(difficultyParam as "Easy" | "Medium" | "Hard");
    }

    if (durationParam) {
      const parsedDuration = Number(durationParam);
      if (!Number.isNaN(parsedDuration) && parsedDuration > 0) {
        setSelectedDuration(parsedDuration);
      }
    }

    if (autoStartParam === "1") {
      setSkipSetupScreen(true);
      setShowInstructions(false);
      setAutoStartRequested(true);
    }

    try {
      const stored = sessionStorage.getItem("interviewSetup");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.resumeText === "string" && parsed.resumeText.trim()) {
          setResumeText(parsed.resumeText);
        }
        if (!cleanTopic && typeof parsed?.topic === "string" && parsed.topic.trim()) {
          setManualTopic(parsed.topic.trim());
        }
      }
    } catch (error) {
      console.warn("Could not read interview setup data", error);
    }
  }, [difficultyParam, durationParam, autoStartParam, cleanTopic]);

  useEffect(() => {
    if (cleanTopic) {
      setMessages([
        {
          text: `Great! You've selected **"${cleanTopic}"**.\n\nNext:\n1. Choose difficulty\n2. Choose duration\n3. Click **Start Interview** when ready (camera & mic will activate)`,
          isBot: true,
        },
      ]);
      setShowDifficulty(true);
    } else if (customTopic) {
      // ← NEW: Resume was uploaded
      setMessages([
        {
          text: `✅ Resume loaded! Auto topic set to **"${customTopic}"**\n\nNow:\n1. Choose difficulty\n2. Choose duration\n3. Click **Start Interview**`,
          isBot: true,
        },
      ]);
      setShowDifficulty(true);
    } else {
      // Case 2: No topic → ask user to type one
      setMessages([
        {
          text: `Welcome to the AI Interview Room!\n\nPlease type the **topic** you want to be interviewed on (e.g., "React Hooks", "System Design", "JavaScript ES6").`,
          isBot: true,
        },
      ]);
      // Do NOT show difficulty yet — wait for user to provide topic
      setShowDifficulty(false);
    }
  }, [cleanTopic, customTopic]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastBotMessage = [...messages].reverse().find((msg) => msg.isBot);
    if (!lastBotMessage) return;

    const asksForCode =
      /(write|implement|create|build).*(code|script|function|command|bash|shell)/i.test(
        lastBotMessage.text,
      ) ||
      /(code|script|bash|shell|terminal|command\s*line|algorithm|pseudo\s*code)/i.test(
        lastBotMessage.text,
      );

    setShowCodeEditor(asksForCode);
  }, [messages]);

  const hasBalancedQuotes = (text: string) => {
    const singleQuotes = (text.match(/(?<!\\)'/g) || []).length;
    const doubleQuotes = (text.match(/(?<!\\)"/g) || []).length;
    return singleQuotes % 2 === 0 && doubleQuotes % 2 === 0;
  };

  const checkCodeSnippet = () => {
    const snippet = codeInput.trim();

    if (!snippet) {
      setCodeCheckResult({
        status: "error",
        message: "Code area is empty. Add your Bash/code answer first.",
      });
      return;
    }

    const dangerousPattern =
      /(rm\s+-rf\s+\/|mkfs|:\(\)\{:\|:&\};:|shutdown|reboot|dd\s+if=|chmod\s+-R\s+777)/i;

    if (dangerousPattern.test(snippet)) {
      setCodeCheckResult({
        status: "warn",
        message:
          "Potentially dangerous command detected. Review before sending.",
      });
      return;
    }

    if (!hasBalancedQuotes(snippet)) {
      setCodeCheckResult({
        status: "warn",
        message: "Quotes look unbalanced. Recheck your syntax.",
      });
      return;
    }

    const hasCommandLikeToken = /(\$\s*\w+|\b(ls|pwd|cd|echo|cat|grep|find|awk|sed|chmod|chown|touch|mkdir|npm|node|python|git|docker|kubectl)\b)/i.test(
      snippet,
    );

    if (!hasCommandLikeToken) {
      setCodeCheckResult({
        status: "warn",
        message:
          "No obvious shell command found yet. If this is pseudocode, you can still send it.",
      });
      return;
    }

    setCodeCheckResult({
      status: "ok",
      message: "Looks good for a Bash/code response.",
    });
  };

  const useCodeInPrompt = () => {
    const snippet = codeInput.trim();
    if (!snippet) return;

    const codeBlock = `\`\`\`bash\n${snippet}\n\`\`\``;
    setInput((prev) => (prev?.trim() ? `${prev}\n\n${codeBlock}` : codeBlock));
  };

  const runAiCodeCheck = async () => {
    const snippet = codeInput.trim();
    if (!snippet) {
      setCodeCheckResult({
        status: "error",
        message: "Add code first before AI checking.",
      });
      return;
    }

    setAiCheckLoading(true);
    setAiCodeResult(null);

    try {
      const finalTopic = cleanTopic || customTopic || manualTopic || "General";
      const res = await fetch(`${API_BASE_URL}/api/code-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: snippet,
          language: "bash",
          topic: finalTopic,
          difficulty: selectedDifficulty || "Medium",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "AI code check failed");
      }

      setAiCodeResult({
        summary: data?.summary || "No summary provided.",
        issues: Array.isArray(data?.issues) ? data.issues : [],
        correctedCode: data?.correctedCode || "",
        expectedOutput: data?.expectedOutput || "No output provided.",
        confidence: data?.confidence || "unknown",
      });
    } catch (error: any) {
      setAiCodeResult({
        summary: "AI check failed.",
        issues: [error?.message || "Unknown error while checking code."],
        correctedCode: "",
        expectedOutput: "No output available.",
        confidence: "low",
      });
    } finally {
      setAiCheckLoading(false);
    }
  };

  // ────────────────────────────────────────────────
  //  Speech Recognition
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window))
      return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let final = "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const part = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += part + " ";
        else interim += part;
      }
      setInput(final.trim() + " " + interim);
    };

    rec.onerror = () => setIsListening(false);
    rec.onend = () => setIsListening(false);

    recognitionRef.current = rec;

    return () => rec.stop();
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) return alert("Speech not supported");
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
    setIsListening(!isListening);
  };

  // ────────────────────────────────────────────────
  //  Backend communication
  // ────────────────────────────────────────────────
  const sendToBackend = async (message: string) => {
    setIsLoading(true);
    try {
      const finalTopic =
        cleanTopic || customTopic || "Full Stack Development (MERN/MEAN)";
      // const API_BASE= "http://localhost:8000";
      // const res = await fetch(`${API_BASE_URL}/api/chat`, {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat: message,
          topic: finalTopic,
          difficulty: selectedDifficulty,
          duration: selectedDuration,
          sessionId,
          resumeText: resumeText || undefined, // ← new field
        }),
      });

      if (!res.ok) throw new Error("Backend error");

      const data = await res.json();
      setMessages((prev) => [...prev, { text: data.reply, isBot: true }]);

      if (data.reply.toLowerCase().includes("interview complete") || data.reply.includes("ended")) {
        persistInterviewContext();
        setInterviewEnded(true);
        stopCamera();
        setTimeout(() => window.location.href = "/congratulations", 1500);
      }
    } catch (err) {
      setMessages((p) => [...p, { text: "Network error. Try again.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startInterview = () => {
    if (interviewStarted) return;

    if (!selectedDifficulty || !selectedDuration) {
      setMessages((p) => [
        ...p,
        { text: "Please select difficulty and duration first.", isBot: true },
      ]);
      return;
    }

    const setupTopic = cleanTopic || customTopic || manualTopic.trim();

    if (!setupTopic) {
      setMessages((p) => [
        ...p,
        { text: "Please choose or type a topic before starting.", isBot: true },
      ]);
      return;
    }

    if (!cleanTopic && setupTopic !== customTopic) {
      setCustomTopic(setupTopic);
    }

    localStorage.setItem(
      "lastInterviewContext",
      JSON.stringify({
        sessionId,
        topic: setupTopic,
        difficulty: selectedDifficulty,
        duration: selectedDuration,
        startedAt: new Date().toISOString(),
      }),
    );

    setInterviewStarted(true);
    startCamera();
    startInterviewTimer(selectedDuration * 60);

    setMessages((p) => [
      ...p,
      {
        text: `🚀 Starting ${selectedDifficulty} interview on **${setupTopic}**...`,
        isBot: true,
      },
    ]);

    sendToBackend("start");
    setInput("");
  };

  useEffect(() => {
    if (!autoStartRequested || interviewStarted || isParsing) return;
    if (!selectedDifficulty || !selectedDuration) return;

    const setupTopic = cleanTopic || customTopic || manualTopic.trim();
    if (!setupTopic) return;

    startInterview();
    setAutoStartRequested(false);
  }, [
    autoStartRequested,
    interviewStarted,
    isParsing,
    selectedDifficulty,
    selectedDuration,
    cleanTopic,
    customTopic,
    manualTopic,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || interviewEnded) return;

    if (!interviewStarted) {
      setMessages((p) => [
        ...p,
        {
          text: "Use the setup section and click Start Interview to begin.",
          isBot: true,
        },
      ]);
      return;
    }

    // Normal message
    setMessages((prev) => [...prev, { text: input.trim(), isBot: false }]);
    sendToBackend(input.trim());
    setInput("");
  };
  // File input handler
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
        const pageText = content.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }

      fullText = fullText
        .replace(/mediaimage.*?}/g, "")
        .replace(/�/g, "•")
        .replace(/\s+/g, " ")
        .trim();

      setResumeText(fullText);

      // 🔥 AUTO SET TOPIC FROM RESUME
      const autoTopic = "Full Stack Development (MERN/MEAN)"; // You can make it smarter later

      setCustomTopic(autoTopic);
      setShowDifficulty(true);
      setMessages((prev) => [
        ...prev,
        {
          text: `✅ Resume parsed successfully!\n📊 ${fullText.length} characters extracted\n\n🎯 **Topic auto-detected:** ${autoTopic}\n\nNow select difficulty + duration and click **Start Interview**`,
          isBot: true,
        },
      ]);

      // Show success badge
      console.log("Resume loaded:", fullText.substring(0, 200));
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { text: "❌ PDF parsing failed. Try again.", isBot: true },
      ]);
    } finally {
      setIsParsing(false);
    }
  };
  const [showCode, setShowCode] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/40">
      <div className="container max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Badge className="px-5 py-2 text-lg bg-green-100 text-green-700 dark:bg-green-900/50">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Interview
            </Badge>
            <h2 className="text-2xl font-bold">Senior React Engineer</h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={toggleCamera}
                className="gap-2"
                disabled={!interviewStarted}
              >
                {isCameraOn ? (
                  <Video className="h-5 w-5" />
                ) : (
                  <VideoOff className="h-5 w-5" />
                )}
                {isCameraOn ? "Camera On" : "Camera Off"}
              </Button>

              <Button
                variant={isMicOn ? "outline" : "destructive"}
                size="lg"
                onClick={toggleMic}
                disabled={!interviewStarted}
              >
                {isMicOn ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <MicOff className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
        {isLoading && (
          <div className="text-center text-gray-500 italic">
            Interviewer thinking...
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 text-center p-8">
            <div className="text-white text-xl max-w-md">
              <p className="font-bold mb-4 text-red-400">Camera Error</p>
              <p>{cameraError}</p>
              <p className="text-sm mt-6 opacity-80">
                Refresh the page and allow camera access when prompted.
              </p>
            </div>
          </div>
        )}
        {showInstructions && cleanTopic && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 border border-purple-500/30 rounded-3xl shadow-2xl p-10">
              <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Important Interview Instructions & Rules
              </h2>

              <div className="space-y-8 text-lg leading-relaxed">
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-400">
                    Welcome to your AI-Powered Interview
                  </h3>
                  <p>
                    You have selected:{" "}
                    <strong className="text-purple-600">{cleanTopic}</strong>
                  </p>
                  <p className="mt-2">
                    This is a realistic, proctored interview simulation. Your
                    performance, body language, and environment will be
                    evaluated.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-400">
                    What You Need to Do
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Allow camera and microphone access when prompted</li>
                    <li>
                      Keep your face clearly visible and centered at all times
                    </li>
                    <li>
                      Speak clearly and naturally — no reading from scripts
                    </li>
                    <li>
                      Stay in frame — do not leave or turn away from the camera
                    </li>
                    <li>Answer honestly and professionally</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-400">
                    Rules & Prohibited Actions
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-red-600 dark:text-red-400 font-medium">
                    <li>
                      No looking at phone, books, notes, or second screens
                    </li>
                    <li>No other people in the room or visible on camera</li>
                    <li>No talking to anyone else during the interview</li>
                    <li>
                      No external help or AI assistance (other than this
                      interviewer)
                    </li>
                    <li>Do not cover or disable the camera/microphone</li>
                  </ul>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Violation of rules may pause the interview or affect your
                    score.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-3 text-purple-700 dark:text-purple-400">
                    How Scoring Works
                  </h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Technical knowledge & communication</li>
                    <li>
                      Body language & confidence (smile, eye contact, calmness)
                    </li>
                    <li>Environment check (no suspicious objects)</li>
                    <li>Final presence score shown at the end</li>
                  </ul>
                </div>

                <div className="text-center mt-10">
                  <p className="text-lg font-medium mb-6">
                    By continuing, you agree to follow all rules and allow
                    real-time monitoring.
                  </p>

                  <Button
                    size="lg"
                    className="px-12 py-7 text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-xl"
                    onClick={() => setShowInstructions(false)}
                  >
                    I Understand & Proceed
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
        {/* ─── Configuration Screen ─── shown until interview starts ─── */}
        {!interviewStarted && !skipSetupScreen && (
          <Card className="mb-10 p-8 bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl shadow-2xl max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Let's set up your interview
            </h3>

            <div className="grid md:grid-cols-2 gap-8 mb-10">
              <div>
                <label className="block text-base font-medium mb-3">
                  Difficulty Level
                </label>
                <Select
                  value={selectedDifficulty ?? undefined}
                  onValueChange={(v) =>
                    setSelectedDifficulty(v as "Easy" | "Medium" | "Hard")
                  }
                >
                  <SelectTrigger className="h-14 text-lg">
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
                <label className="block text-base font-medium mb-3">
                  Duration
                </label>
                <Select
                  value={selectedDuration?.toString() ?? undefined}
                  onValueChange={(v) => setSelectedDuration(Number(v))}
                >
                  <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Choose duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="20">20 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-center text-muted-foreground text-lg">
              {selectedDifficulty && selectedDuration ? (
                <p>
                  Everything is ready! Type{" "}
                  <strong className="text-purple-600 font-semibold">Start Interview</strong>{" "}
                  to begin the interview
                </p>
              ) : (
                <p>Please select difficulty and duration to continue</p>
              )}
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-base font-medium">
                  Topic
                </label>
                {cleanTopic ? (
                  <div className="h-14 rounded-lg border border-border bg-muted/40 px-4 flex items-center text-base">
                    {cleanTopic}
                  </div>
                ) : (
                  <Textarea
                    value={manualTopic}
                    onChange={(e) => setManualTopic(e.target.value)}
                    placeholder="Type your interview topic (e.g. React Hooks, System Design, Node.js)"
                    className="min-h-20 resize-none"
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-base font-medium">
                  Upload Resume (Optional PDF)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleResumeUpload}
                  className="block h-14 w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-gray-500 file:mr-3 file:rounded-md file:border-0 file:bg-purple-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-purple-700 hover:file:bg-purple-200"
                />
                {isParsing && (
                  <p className="mt-2 text-sm text-purple-600">Parsing resume...</p>
                )}
                {resumeText && (
                  <p className="mt-2 text-sm text-green-600">
                    Resume loaded ({(resumeText.length / 1000).toFixed(1)} k chars)
                  </p>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Button
                type="button"
                size="lg"
                className="px-10 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={startInterview}
                disabled={
                  !selectedDifficulty ||
                  !selectedDuration ||
                  isParsing ||
                  (!cleanTopic && !customTopic && !manualTopic.trim())
                }
              >
                Start Interview
              </Button>
            </div>
          </Card>
        )}

        <div className="flex gap-6">
          {/* LEFT: Chat */}
          <Card className="flex-[0.7] h-[85vh] flex flex-col bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            {/* {cameraActive && (
              <div
                className="absolute top-3 right-3 bg-black/65 text-white text-sm px-3 py-2 rounded-md font-mono z-10 shadow"
              >
                <div>😊 Smile: {smileScore.toFixed(0)}%</div>
                <div
                  className={stressScore > 60 ? "text-red-400" : "text-white"}
                >
                  😰 Stress: {stressScore.toFixed(0)}%
                </div>
                <div
                  className={
                    confidenceScore > 60 ? "text-blue-400" : "text-white"
                  }
                >
                  💪 Conf: {confidenceScore.toFixed(0)}%
                </div>
              </div>
            )} */}
            <div className="p-6 border-b">
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white text-xl font-bold">
                    N
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">Nova AI Interviewer</p>
                  <p className="text-sm text-muted-foreground">
                    Real-time evaluation
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-4 ${msg.isBot ? "" : "justify-end"}`}
                >
                  {msg.isBot && (
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                        N
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] ${msg.isBot
                      ? "bg-gray-100 dark:bg-white/10"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      } px-4 py-2 rounded-2xl shadow-lg text-base whitespace-pre-line`}
                  >
                    {msg.text}
                  </div>
                  {!msg.isBot && (
                    <Avatar>
                      <AvatarFallback className="bg-gray-400 text-white">
                        U
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* <div className="p-6 border-t">
              <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <Button
                  type="button"
                  size="lg"
                  variant={isListening ? "default" : "outline"}
                  onClick={toggleVoiceInput}
                  className={`gap-2 ${isListening ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""}`}
                  disabled={!interviewStarted || isPaused || interviewEnded}
                >
                  <Mic className="h-6 w-6" />
                  {isListening ? "Listening..." : "Speak"}
                </Button>

                <Button
                  type="button"
                  size="lg"
                  variant={isMicOn ? "outline" : "destructive"}
                  onClick={toggleMic}
                  disabled={!interviewStarted}
                >
                  {isMicOn ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </Button>

                <Textarea
                  placeholder={
                    isPaused
                      ? 'Type "yes" or "ok" to continue...'
                      : interviewStarted
                        ? "Type your answer or click Speak to dictate..."
                        : "Complete setup above and click Start Interview"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-10 max-h-40 resize-none flex-1"
                  disabled={!interviewStarted || isPaused || interviewEnded}
                />

                <Button
                  type="submit"
                  size="lg"
                  disabled={
                    !input.trim() || isLoading || interviewEnded || isPaused
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 min-w-[70px]"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </form>

              {isListening && (
                <p className="text-center mt-4 text-green-600 font-semibold animate-pulse">
                  🎤 Listening... Speak clearly!
                </p>
              )}

            </div> */}
            <div className="p-4 border-t">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 bg-[#111827] border border-gray-700 rounded-2xl px-3 py-2 shadow-lg"
              >

                {/* Voice Input */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={!interviewStarted || isPaused || interviewEnded}
                  className={`p-2 rounded-lg ${isListening
                    ? "bg-red-600 animate-pulse"
                    : "hover:bg-white/10"
                    }`}
                >
                  <Mic className="h-5 w-5 text-white" />
                </button>

                {/* Mic Toggle */}
                <button
                  type="button"
                  onClick={toggleMic}
                  disabled={!interviewStarted}
                  className={`p-2 rounded-lg ${isMicOn ? "hover:bg-white/10" : "bg-red-600"
                    }`}
                >
                  {isMicOn ? (
                    <Mic className="h-5 w-5 text-white" />
                  ) : (
                    <MicOff className="h-5 w-5 text-white" />
                  )}
                </button>

                {/* Input */}
                {/* <input
      value={input}
      onChange={(e) => setInput(e.target.value)}
      placeholder={
        isPaused
          ? 'Type "yes" or "ok" to continue...'
          : interviewStarted
          ? "Type your answer..."
          : "Complete setup and start interview"
      }
      disabled={!interviewStarted || isPaused || interviewEnded}
      className="flex-1 bg-transparent outline-none text-white placeholder-gray-400 px-2"
      onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  }} */}
                <textarea
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isPaused
                      ? 'Type "yes" or "ok" to continue...'
                      : interviewStarted
                        ? "Type your answer..."
                        : "Complete setup and start interview"
                  }
                  disabled={!interviewStarted || isPaused || interviewEnded}
                  className="flex-1 bg-transparent outline-none resize-none text-white px-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmit(e as any);
                    }
                  }}
                />

                {/* Send */}
                <button
                  type="submit"
                  disabled={
                    !input.trim() || isLoading || interviewEnded || isPaused
                  }
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-3 py-2 rounded-lg"
                >
                  <Send className="h-5 w-5 text-white" />
                </button>
              </form>

              {/* Listening Indicator */}
              {isListening && (
                <p className="text-center mt-3 text-green-500 text-sm animate-pulse">
                  🎤 Listening...
                </p>
              )}
            </div>
          </Card>

          {/* RIGHT: Video + overlay states */}



          <div className="flex-[0.3] flex flex-col gap-4">

            {/* TOP: Stats + Timer */}
            <div className="bg-[#111827] rounded-xl p-4 shadow-md flex justify-between items-center">

              {/* Stats */}
              {cameraActive &&
                <div className="text-sm space-y-1">
                  <p>😊 Smile: {smileScore.toFixed(0)}%</p>
                  <p className={stressScore > 60 ? "text-red-400" : ""}>
                    😰 Stress: {stressScore.toFixed(0)}%
                  </p>
                  <p className={confidenceScore > 60 ? "text-blue-400" : ""}>
                    💪 Conf: {confidenceScore.toFixed(0)}%
                  </p>
                </div>
              }

              {/* Timer */}
              {interviewStarted && timeLeft !== null && (
                <div className="text-lg font-mono bg-black/50 px-4 py-2 rounded-lg">
                  ⏱ {interviewEnded ? "00:00" : formatTime(timeLeft)}
                </div>
              )}

            </div>

            {/* CAMERA */}
            <Card className="rounded-2xl overflow-hidden shadow-2xl bg-gray-900 relative">
              <div className="relative aspect-video h-[220px]">

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Before interview */}
                {!interviewStarted && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
                    <p className="text-white text-lg font-semibold text-center px-6">
                      Camera will start when interview begins
                    </p>
                  </div>
                )}

                {/* Camera off */}
                {interviewStarted && !isCameraOn && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
                    <p className="text-white text-xl font-bold">
                      Camera Off
                    </p>
                  </div>
                )}

                {/* Final Score */}
                {interviewEnded && finalScore !== null && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white z-50">
                    <h2 className="text-2xl font-bold mb-3">Interview Complete</h2>
                    <p className="text-5xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {finalScore}%
                    </p>
                    <p className="text-sm mt-2">Presence Score</p>
                  </div>
                )}

              </div>
            </Card>

          </div>
        </div>
        <div className="mt-4">
          <Card className="rounded-2xl border border-cyan-500/30 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-3 flex items-center gap-2">
              <TerminalSquare className="h-5 w-5 text-cyan-600" />
              <p className="text-base font-semibold">Code Workspace (Bash / shell)</p>
            </div>

            <Textarea
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="Write your Bash/script answer here..."
              className="min-h-60 resize-y bg-background font-mono text-sm"
              disabled={interviewEnded}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={checkCodeSnippet}
                disabled={interviewEnded}
              >
                Check Code
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={runAiCodeCheck}
                disabled={!codeInput.trim() || interviewEnded || aiCheckLoading}
              >
                {aiCheckLoading ? "AI Checking..." : "AI Check & Output"}
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                onClick={useCodeInPrompt}
                disabled={!codeInput.trim() || interviewEnded}
              >
                Use in Prompt
              </Button>
            </div>

            {codeCheckResult.status !== "idle" && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                {codeCheckResult.status === "ok" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                )}
                <span
                  className={
                    codeCheckResult.status === "ok"
                      ? "text-green-700 dark:text-green-400"
                      : codeCheckResult.status === "error"
                        ? "text-red-700 dark:text-red-400"
                        : "text-amber-700 dark:text-amber-400"
                  }
                >
                  {codeCheckResult.message}
                </span>
              </div>
            )}

            {aiCodeResult && (
              <div className="mt-4 rounded-xl border border-cyan-500/30 bg-background/80 p-4 text-sm">
                <p className="font-semibold text-cyan-700 dark:text-cyan-400">AI Review</p>
                <p className="mt-1 text-muted-foreground">{aiCodeResult.summary}</p>

                <p className="mt-3 font-semibold">Issues</p>
                {aiCodeResult.issues.length > 0 ? (
                  <ul className="mt-1 list-disc pl-5 text-muted-foreground space-y-1">
                    {aiCodeResult.issues.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-muted-foreground">No major issues found.</p>
                )}

                <p className="mt-3 font-semibold">Expected Output</p>
                <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                  {aiCodeResult.expectedOutput}
                </pre>

                {aiCodeResult.correctedCode && (
                  <>
                    <p className="mt-3 font-semibold">Suggested Code</p>
                    <pre className="mt-1 whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
                      {aiCodeResult.correctedCode}
                    </pre>
                  </>
                )}

                <p className="mt-3 text-xs text-muted-foreground">
                  Confidence: {aiCodeResult.confidence}
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Pause modal – same style */}
      {
        (showMultiFaceModal || showSuspiciousObjectModal) && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <Card className="p-10 max-w-lg text-center bg-white/95 dark:bg-slate-900/95 border border-purple-500/30 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-bold text-red-600 mb-6">
                {showMultiFaceModal
                  ? "Multiple Faces Detected"
                  : "Suspicious Object Detected"}
              </h2>
              <p className="text-xl mb-8 leading-relaxed">
                {showMultiFaceModal
                  ? "Please make sure only you are visible during the interview."
                  : `Please remove: ${suspiciousObjectsList.join(", ")} from view.`}
              </p>
              <p className="text-lg text-muted-foreground mb-10">
                Type <strong>"yes"</strong> or <strong>"ok"</strong> to resume
              </p>
              <Button
                size="lg"
                onClick={() => {
                  setIsPaused(false);
                  setShowMultiFaceModal(false);
                  setShowSuspiciousObjectModal(false);
                }}
                className="px-12 py-7 text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                I've Fixed It
              </Button>
            </Card>
          </div>
        )
      }

      {/* Exit button */}
      <button className="rounded-lg text-black bg-slate-500 hover:bg-slate-600 w-28 h-12 fixed bottom-8 right-8 flex items-center justify-center shadow-lg pl-3 text-base font-medium">
        <Link href="/congratulations">Exit</Link>
        <MoveRight className="ml-3 h-5 w-5" />
      </button>
      {
        resumeText && (
          <Badge variant="outline" className="ml-2 bg-green-950 text-green-300">
            Resume loaded ({(resumeText.length / 1000).toFixed(1)} k chars)
          </Badge>
        )
      }
    </div >
  );
}
