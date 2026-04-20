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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://virtual-interview-32pw.onrender.com";

interface Message {
  text: string;
  isBot: boolean;
}

interface InterviewRoomProps {
  selectedTopic: string | null;
}
//objectDtector where object are store initially it will be null

let objectDetector: ObjectDetector | null = null;

const normalizeInterviewTopic = (rawTopic: string) => {
  const decoded = decodeURIComponent(rawTopic || "").replace(/\s+/g, " ").trim();
  if (!decoded) return "";

  const masteringMatch = decoded.match(/^mastering\s+(.+?)\s+in\s+\d{4}$/i);
  if (masteringMatch?.[1]) {
    return masteringMatch[1].trim();
  }

  return decoded;
};

export default function InterviewRoom({ selectedTopic }: InterviewRoomProps) {
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get("difficulty");
  const durationParam = searchParams.get("duration");
  const autoStartParam = searchParams.get("autostart");
  const cleanTopic = selectedTopic ? normalizeInterviewTopic(selectedTopic) : null;
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
  const emotionSamplesRef = useRef<
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
  const [showTabSwitchModal, setShowTabSwitchModal] = useState<boolean>(false);
  const [suspiciousObjectsList, setSuspiciousObjectsList] = useState<string[]>(
    [],
  );
  const lastObjectAlertTimeRef = useRef<number>(0);
  const suspiciousFrameStreakRef = useRef<number>(0);
  const OBJECT_ALERT_COOLDOWN_MS = 10000;
  const FACE_DETECTION_INTERVAL_MS = 450;
  const OBJECT_DETECTION_INTERVAL_MS = 700;
  const OBJECT_SUSPICIOUS_MIN_SCORE = 0.5;
  const OBJECT_SUSPICIOUS_MIN_AREA_RATIO = 0.04;
  const OBJECT_LAPTOP_MIN_SCORE = 0.72;
  const OBJECT_LAPTOP_MIN_AREA_RATIO = 0.1;
  const OBJECT_USER_LAPTOP_BOTTOM_ZONE = 0.7;
  const OBJECT_SUSPICIOUS_CONSECUTIVE_FRAMES = 3;
  const lastFaceDetectionTimeRef = useRef<number>(0);
  const lastObjectDetectionTimeRef = useRef<number>(0);
  const isFaceDetectionRunningRef = useRef(false);
  const isObjectDetectionRunningRef = useRef(false);

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const codeTextareaRef = useRef<HTMLTextAreaElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const previousMessageCountRef = useRef(0);
  const [showNewMessagesButton, setShowNewMessagesButton] = useState(false);
  const recognitionRef = useRef<any>(null);
  const hasEndedRef = useRef(false);
  const timerActiveRef = useRef(false);
  const cameraActiveRef = useRef(false);
  const interviewStartedRef = useRef(false);
  const interviewEndedRef = useRef(false);
  const isModelReadyRef = useRef(false);
  const isPausedRef = useRef(false);
  const proctoringIncidentRef = useRef({ multiFace: 0, suspiciousObject: 0 });
  const lastInterviewQuestionRef = useRef<string>("");

  const currentTimeRef = useRef<number | null>(null);

  useEffect(() => {
    cameraActiveRef.current = cameraActive;
  }, [cameraActive]);

  useEffect(() => {
    interviewStartedRef.current = interviewStarted;
  }, [interviewStarted]);

  useEffect(() => {
    interviewEndedRef.current = interviewEnded;
  }, [interviewEnded]);

  useEffect(() => {
    isModelReadyRef.current = isModelReady;
  }, [isModelReady]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  const runTimerInterval = () => {
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

        setTimeout(() => {
          window.location.href = "/congratulations";
        }, 1500);
      }
    }, 1000);
  };

  const startInterviewTimer = (seconds: number) => {
    console.log("[TIMER] Starting with", seconds, "seconds");

    setTimeLeft(seconds);
    currentTimeRef.current = seconds;
    setIsTimerRunning(true);
    hasEndedRef.current = false;
    runTimerInterval();
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
          width: { ideal: 960 },
          height: { ideal: 540 },
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

  const resumeInterviewTimer = () => {
    if (currentTimeRef.current === null || currentTimeRef.current <= 0) return;

    setIsTimerRunning(true);
    runTimerInterval();
  };

  const getSuspiciousDetections = useCallback(
    (
      detections: Array<{
        categories?: Array<{ categoryName?: string; score?: number }>;
        boundingBox?: {
          originX?: number;
          originY?: number;
          width?: number;
          height?: number;
        };
      }>,
      video: HTMLVideoElement,
    ) => {
      const frameArea = Math.max(1, (video.videoWidth || 1) * (video.videoHeight || 1));

      return detections.filter((detection) => {
        const label = (detection.categories?.[0]?.categoryName || "").toLowerCase();
        const score = detection.categories?.[0]?.score ?? 0;
        const originY = detection.boundingBox?.originY ?? 0;
        const width = detection.boundingBox?.width ?? 0;
        const height = detection.boundingBox?.height ?? 0;
        const areaRatio = (width * height) / frameArea;

        const isPhone = /cell phone|mobile phone|smartphone|\bphone\b/.test(label);
        const isBookLike = /\bbook\b|\bnotebook\b|\bnotepad\b|\bdiary\b|\bjournal\b/.test(label);
        const isLaptopLike = /\blaptop\b|notebook computer/.test(label);

        if (isLaptopLike) {
          const videoHeight = Math.max(1, video.videoHeight || 1);
          const normalizedBottomEdge = (originY + height) / videoHeight;
          const looksLikeUserPrimaryLaptop =
            normalizedBottomEdge >= OBJECT_USER_LAPTOP_BOTTOM_ZONE;

          if (looksLikeUserPrimaryLaptop) {
            return false;
          }

          return (
            score >= OBJECT_LAPTOP_MIN_SCORE &&
            areaRatio >= OBJECT_LAPTOP_MIN_AREA_RATIO
          );
        }

        if (isBookLike) {
          return score >= 0.32 && areaRatio >= 0.012;
        }

        if (isPhone) {
          return score >= OBJECT_SUSPICIOUS_MIN_SCORE && areaRatio >= 0.015;
        }

        return false;
      });
    },
    [],
  );

  const validateInterviewConditions = useCallback(async () => {
    if (
      !videoRef.current ||
      !cameraActiveRef.current ||
      interviewEndedRef.current ||
      !isModelReadyRef.current
    ) {
      return { ok: false, message: "Camera is not ready yet." };
    }

    const video = videoRef.current;
    if (video.paused || video.ended || video.videoWidth === 0) {
      return { ok: false, message: "Camera feed is not ready yet." };
    }

    try {
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }),
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      if (detections.length > 1) {
        return {
          ok: false,
          message: "Multiple faces are still visible. Please leave only one person in frame.",
        };
      }

      if (objectDetector) {
        const results = await objectDetector.detectForVideo(video, performance.now());
        const suspicious = getSuspiciousDetections(results.detections, video);

        if (suspicious.length > 0) {
          const labels = [...new Set(suspicious.map((d) => d.categories?.[0]?.categoryName || "unknown"))];
          setSuspiciousObjectsList(labels);
          return {
            ok: false,
            message: `Please remove: ${labels.join(", ")} from view before resuming.`,
          };
        }
      }

      return { ok: true, message: "" };
    } catch (error) {
      console.error("Resume validation failed", error);
      return {
        ok: false,
        message: "Unable to recheck the camera right now. Please try again.",
      };
    }
  }, [getSuspiciousDetections]);

  const handleFixedIt = async () => {
    const validation = await validateInterviewConditions();

    if (!validation.ok) {
      setIsPaused(true);
      isPausedRef.current = true;
      setMessages((prev) => [...prev, { text: validation.message, isBot: true }]);
      return;
    }

    setShowMultiFaceModal(false);
    setShowSuspiciousObjectModal(false);
    setShowTabSwitchModal(false);
    setIsPaused(false);
    isPausedRef.current = false;

    setMessages((prev) => {
      const resumedMessages = [...prev, { text: "Checks passed. Resuming interview.", isBot: true }];

      if (lastInterviewQuestionRef.current.trim()) {
        resumedMessages.push({
          text: `Question again: ${lastInterviewQuestionRef.current}`,
          isBot: true,
        });
      }

      return resumedMessages;
    });
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
          scoreThreshold: 0.35,
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
    if (!videoRef.current || !cameraActiveRef.current || interviewEndedRef.current || !isModelReadyRef.current) {
      requestAnimationFrame(detectEmotions);
      return;
    }

    if (isPausedRef.current) {
      requestAnimationFrame(detectEmotions);
      return;
    }

    const now = performance.now();
    if (now - lastFaceDetectionTimeRef.current < FACE_DETECTION_INTERVAL_MS) {
      requestAnimationFrame(detectEmotions);
      return;
    }

    if (isFaceDetectionRunningRef.current) {
      requestAnimationFrame(detectEmotions);
      return;
    }

    isFaceDetectionRunningRef.current = true;
    lastFaceDetectionTimeRef.current = now;

    const video = videoRef.current;
    if (video.paused || video.ended || video.videoWidth === 0) {
      isFaceDetectionRunningRef.current = false;
      requestAnimationFrame(detectEmotions);
      return;
    }

    try {
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }),
        )
        .withFaceLandmarks()
        .withFaceExpressions();

      setFacesDetected(detections.length);

      if (detections.length > 1) {
        proctoringIncidentRef.current.multiFace += 1;
        setIsPaused(true);
        isPausedRef.current = true;
        setShowMultiFaceModal(true);
        setShowSuspiciousObjectModal(false);
        setShowTabSwitchModal(false);
        setMessages((p) => [
          ...p,
          {
            text: "Multiple faces detected. Please ensure only you are visible before resuming.",
            isBot: true,
          },
        ]);
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

        emotionSamplesRef.current = [
          ...emotionSamplesRef.current.slice(-119),
          { smile, stress, conf, timestamp: Date.now() },
        ];
      } else {
        setSmileScore(0);
        setStressScore(0);
        setConfidenceScore(30);
      }
    } catch (err) {
      console.error("Emotion detection error", err);
    } finally {
      isFaceDetectionRunningRef.current = false;
    }

    requestAnimationFrame(detectEmotions);
  }, []);

  const calculateFinalPresenceScore = () => {
    const emotionSamples = emotionSamplesRef.current;

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
        proctoring: {
          multiFace: proctoringIncidentRef.current.multiFace,
          suspiciousObject: proctoringIncidentRef.current.suspiciousObject,
        },
        endedAt: new Date().toISOString(),
      }),
    );
  }, [cleanTopic, customTopic, manualTopic, selectedDifficulty, selectedDuration, sessionId]);

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
      !cameraActiveRef.current ||
      interviewEndedRef.current
    ) {
      requestAnimationFrame(detectObjects);
      return;
    }

    if (isPausedRef.current) {
      requestAnimationFrame(detectObjects);
      return;
    }

    const now = performance.now();
    if (now - lastObjectDetectionTimeRef.current < OBJECT_DETECTION_INTERVAL_MS) {
      requestAnimationFrame(detectObjects);
      return;
    }

    if (isObjectDetectionRunningRef.current) {
      requestAnimationFrame(detectObjects);
      return;
    }

    isObjectDetectionRunningRef.current = true;
    lastObjectDetectionTimeRef.current = now;

    try {
      const results = await objectDetector.detectForVideo(
        videoRef.current,
        performance.now(),
      );
      const suspicious = getSuspiciousDetections(results.detections, videoRef.current);

      const hasBookLikeSuspicious = suspicious.some((d) => {
        const label = (d.categories?.[0]?.categoryName || "").toLowerCase();
        return /\bbook\b|\bnotebook\b|\bnotepad\b|\bdiary\b|\bjournal\b/.test(label);
      });
      const requiredSuspiciousFrames = hasBookLikeSuspicious
        ? 2
        : OBJECT_SUSPICIOUS_CONSECUTIVE_FRAMES;

      if (suspicious.length > 0) {
        suspiciousFrameStreakRef.current += 1;
      } else {
        suspiciousFrameStreakRef.current = 0;
      }

      if (
        suspicious.length > 0 &&
        !isPausedRef.current &&
        suspiciousFrameStreakRef.current >= requiredSuspiciousFrames
      ) {
        const now = Date.now();
        if (now - lastObjectAlertTimeRef.current > OBJECT_ALERT_COOLDOWN_MS) {
          proctoringIncidentRef.current.suspiciousObject += 1;
          const labels = [
            ...new Set(
              suspicious.map((d) => d.categories?.[0]?.categoryName || "unknown"),
            ),
          ];
          setSuspiciousObjectsList(labels);
          setShowSuspiciousObjectModal(true);
          setIsPaused(true);
          isPausedRef.current = true;
          setMessages((p) => [
            ...p,
            {
              text: `Suspicious object(s) detected: ${labels.join(", ")}. Please remove them.`,
              isBot: true,
            },
          ]);
          lastObjectAlertTimeRef.current = now;
          suspiciousFrameStreakRef.current = 0;
        }
      }
    } catch (err) {
      console.error("Object detection error", err);
    } finally {
      isObjectDetectionRunningRef.current = false;
    }

    requestAnimationFrame(detectObjects);
  }, [getSuspiciousDetections]);

  useEffect(() => {
    if (cameraActive) detectObjects();
  }, [cameraActive, detectObjects]);

  // ────────────────────────────────────────────────
  //  Pause / Resume logic
  // ────────────────────────────────────────────────
  useEffect(() => {
    if (isPaused) {
      pauseTimer();
    } else if (timeLeft != null && timeLeft > 0 && !isTimerRunning && interviewStartedRef.current && !interviewEndedRef.current) {
      resumeInterviewTimer();
    }
  }, [isPaused, isTimerRunning, timeLeft]);

  useEffect(() => {
    const handleDisturbance = () => {
      if (!interviewStartedRef.current || interviewEndedRef.current) return;
      if (isPausedRef.current) return;

      if (document.visibilityState === "hidden" || !document.hasFocus()) {
        setShowMultiFaceModal(false);
        setShowSuspiciousObjectModal(false);
        setShowTabSwitchModal(true);
        setIsPaused(true);
        isPausedRef.current = true;
        setMessages((prev) => [
          ...prev,
          {
            text: "Tab switch or window focus loss detected. Return to the interview tab to continue.",
            isBot: true,
          },
        ]);
      }
    };

    window.addEventListener("blur", handleDisturbance);
    document.addEventListener("visibilitychange", handleDisturbance);

    return () => {
      window.removeEventListener("blur", handleDisturbance);
      document.removeEventListener("visibilitychange", handleDisturbance);
    };
  }, []);

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

  const handleChatScroll = () => {
    const container = chatScrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 72;

    if (shouldAutoScrollRef.current) {
      setShowNewMessagesButton(false);
    }
  };

  const jumpToLatestMessage = () => {
    const container = chatScrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
    shouldAutoScrollRef.current = true;
    setShowNewMessagesButton(false);
  };

  // Keep auto-scroll inside the chat panel only when user is near bottom.
  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container) return;

    const messageCountIncreased = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (!messageCountIncreased) return;

    if (!shouldAutoScrollRef.current) {
      setShowNewMessagesButton(true);
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });

    setShowNewMessagesButton(false);
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

  const sendCodeToPrompt = () => {
    const snippet = codeInput.trim();
    if (!snippet) return;

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

    if (isLoading || interviewEnded || isPaused) return;

    setMessages((prev) => [...prev, { text: snippet, isBot: false }]);
    sendToBackend(snippet);
  };

  const clearCodeInput = () => {
    setCodeInput("");
    setCodeCheckResult({ status: "idle", message: "" });
    setAiCodeResult(null);
  };

  const handleCodeTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key !== "Tab") return;

    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const nextValue = `${codeInput.slice(0, start)}    ${codeInput.slice(end)}`;

    setCodeInput(nextValue);

    requestAnimationFrame(() => {
      target.selectionStart = start + 4;
      target.selectionEnd = start + 4;
    });
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

      const replyText = String(data.reply || "").trim();
      if (
        replyText &&
        replyText.includes("?") &&
        !replyText.toLowerCase().includes("interview complete")
      ) {
        lastInterviewQuestionRef.current = replyText;
      }

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
  const activeTopicHeading = cleanTopic || customTopic || manualTopic.trim() || "Interview";
  const activeDifficultyHeading = selectedDifficulty || "Medium";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/40">
      <div className="container mx-auto max-w-7xl px-4 py-4 pb-24 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <Badge className="px-4 py-2 text-sm bg-green-100 text-green-700 dark:bg-green-900/50 sm:px-5 sm:text-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Interview
            </Badge>
            <h2 className="text-xl font-bold sm:text-2xl">{`${activeTopicHeading} (${activeDifficultyHeading})`}</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 lg:gap-6">
            <div className="flex flex-wrap gap-3">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm sm:p-6">
            <Card className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-purple-500/30 bg-white/95 p-6 shadow-2xl dark:bg-slate-900/95 sm:p-10">
              <h2 className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-center text-2xl font-bold text-transparent sm:mb-8 sm:text-3xl">
                Important Interview Instructions & Rules
              </h2>

              <div className="space-y-6 text-base leading-relaxed sm:space-y-8 sm:text-lg">
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-purple-700 dark:text-purple-400 sm:text-xl">
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
                  <h3 className="mb-3 text-lg font-semibold text-purple-700 dark:text-purple-400 sm:text-xl">
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
                  <h3 className="mb-3 text-lg font-semibold text-purple-700 dark:text-purple-400 sm:text-xl">
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
                  <h3 className="mb-3 text-lg font-semibold text-purple-700 dark:text-purple-400 sm:text-xl">
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

                <div className="mt-8 text-center sm:mt-10">
                  <p className="mb-6 text-base font-medium sm:text-lg">
                    By continuing, you agree to follow all rules and allow
                    real-time monitoring.
                  </p>

                  <Button
                    size="lg"
                    className="px-8 py-6 text-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-xl hover:from-purple-700 hover:to-pink-700 sm:px-12 sm:py-7 sm:text-xl"
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
          <Card className="mx-auto mb-10 max-w-4xl rounded-3xl border border-gray-200/50 bg-white/90 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-black/70 sm:p-8">
            <h3 className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-center text-2xl font-bold text-transparent">
              Let's set up your interview
            </h3>

            <div className="mb-10 grid gap-6 lg:grid-cols-2">
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

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
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

        <div className="flex flex-col gap-6 xl:flex-row">
          {/* LEFT: Chat */}
          <Card className="relative flex min-h-[36rem] flex-col bg-white/90 backdrop-blur-xl border border-gray-200/50 dark:bg-black/70 dark:border-white/10 xl:h-[85vh] xl:min-h-0 xl:flex-[0.68]">
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
            <div className="border-b p-4 sm:p-6">
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

            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6"
            >
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
                      } px-4 py-2 rounded-2xl shadow-lg text-base whitespace-pre-line sm:max-w-[72%]`}
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
            </div>
            {showNewMessagesButton && (
              <div className="absolute bottom-20 left-1/2 z-20 -translate-x-1/2 sm:bottom-24">
                <Button
                  type="button"
                  size="sm"
                  onClick={jumpToLatestMessage}
                  className="rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700"
                >
                  New messages
                </Button>
              </div>
            )}
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
            <div className="border-t p-4">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-2 rounded-2xl border border-gray-700 bg-[#111827] px-3 py-2 shadow-lg sm:flex-row sm:items-center"
              >

                {/* Voice Input */}
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={!interviewStarted || isPaused || interviewEnded}
                  className={`self-start rounded-lg p-2 ${isListening
                    ? "bg-red-600 animate-pulse"
                    : "hover:bg-white/10"
                    }`}
                >
                  <Mic className="h-5 w-5 text-white" />
                </button>

                {/* Mic Toggle */}
                {/* <button
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
                </button> */}

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
                  className="min-h-11 flex-1 resize-none bg-transparent px-2 text-white outline-none"
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
                  className="self-end rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-2 hover:from-purple-700 hover:to-pink-700 sm:self-auto"
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



          <div className="flex flex-col gap-4 xl:flex-[0.32]">

            {/* TOP: Stats + Timer */}
            <div className="flex flex-col gap-3 rounded-xl bg-[#111827] p-4 shadow-md sm:flex-row sm:items-center sm:justify-between">

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
            <Card className="relative overflow-hidden rounded-2xl bg-gray-900 shadow-2xl">
              <div className="relative aspect-video min-h-[220px] sm:min-h-[260px]">

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
              ref={codeTextareaRef}
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={handleCodeTextareaKeyDown}
              placeholder="Write your Bash/script answer here..."
              className="min-h-52 resize-y bg-background font-mono text-sm sm:min-h-60"
              disabled={interviewEnded}
            />

            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearCodeInput}
                disabled={!codeInput.trim() || interviewEnded}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                onClick={sendCodeToPrompt}
                disabled={!codeInput.trim() || interviewEnded || isLoading || isPaused}
              >
                Send to Prompt
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Pause modal – same style */}
      {
        (showMultiFaceModal || showSuspiciousObjectModal || showTabSwitchModal) && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
            <Card className="p-10 max-w-lg text-center bg-white/95 dark:bg-slate-900/95 border border-purple-500/30 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-bold text-red-600 mb-6">
                {showMultiFaceModal
                  ? "Multiple Faces Detected"
                  : showSuspiciousObjectModal
                    ? "Suspicious Object Detected"
                    : "Window Focus Lost"}
              </h2>
              <p className="text-xl mb-8 leading-relaxed">
                {showMultiFaceModal
                  ? "Please make sure only you are visible during the interview."
                  : showSuspiciousObjectModal
                    ? `Please remove: ${suspiciousObjectsList.join(", ")} from view.`
                    : "Return to the interview tab and keep the page visible while you continue."}
              </p>
              <p className="text-lg text-muted-foreground mb-10">
                Type <strong>"yes"</strong> or <strong>"ok"</strong> to resume
              </p>
              <Button
                size="lg"
                type="button"
                onClick={handleFixedIt}
                className="px-12 py-7 text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                I've Fixed It
              </Button>
            </Card>
          </div>
        )
      }

      {/* Exit button */}
      <button className="fixed bottom-4 right-4 flex h-11 w-24 items-center justify-center rounded-lg bg-slate-500 pl-3 text-base font-medium text-black shadow-lg hover:bg-slate-600 sm:bottom-8 sm:right-8 sm:h-12 sm:w-28">
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
