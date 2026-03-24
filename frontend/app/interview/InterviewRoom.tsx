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
import * as pdfjsLib from "pdfjs-dist";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.5.207/build/pdf.worker.min.mjs";
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
  // fetching topic from url
  const topicParam = searchParams.get("topic");
  //? is used for shortcut of if else
  const cleanTopic = topicParam ? decodeURIComponent(topicParam) : null;
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

  //import { useRef } from "react";

  // function InputFocus() {
  //   const inputRef = useRef(null);

  //   const focusInput = () => {
  //     inputRef.current.focus();
  //   };

  //   return (
  //     <>
  //       <input ref={inputRef} />
  //       <button onClick={focusInput}>Focus</button>
  //     </>
  //   );
  // }
  //inputRef stores the input element
  // inputRef.current gives access to it

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Selection states
  const [showDifficulty, setShowDifficulty] = useState<boolean>(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<
    "Easy" | "Medium" | "Hard" | null
  >(null);
  const [showDuration, setShowDuration] = useState<boolean>(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null); // minutes

  // Camera & Media states
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false);

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
  const hasEvaluatedRef = useRef(false);   // ← ADD THIS LINE
  
  // useRef is often used to store values that should persist between renders without causing a re-render.
  // ────────────────────────────────────────────────
  //  Timer Logic
  // ────────────────────────────────────────────────
// Start timer
const currentTimeRef = useRef<number | null>(null);

const startInterviewTimer = (seconds: number) => {
  console.log("[TIMER] Starting with", seconds, "seconds");

  setTimeLeft(seconds);
  currentTimeRef.current = seconds;
  setIsTimerRunning(true);
  hasEndedRef.current = false;

  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }

  timerRef.current = setInterval(() => {
    if (hasEndedRef.current || currentTimeRef.current === null) {
      return;
    }

    const next = currentTimeRef.current - 1;
    currentTimeRef.current = next; // update ref immediately (synchronous)

    setTimeLeft(next); // update UI

    console.log("[TIMER TICK] Set to:", next);

   if (next <= 0) {
  console.log("[TIMER] Reached 0 - ending");
  clearInterval(timerRef.current!);
  timerRef.current = null;
  currentTimeRef.current = null;

  finishInterview(); // ✅ SINGLE ENTRY POINT
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

const resumeTimer = () => {
  if (hasEndedRef.current || currentTimeRef.current === null || currentTimeRef.current <= 0) {
    console.log("[TIMER] Cannot resume");
    return;
  }

  console.log("[TIMER] Resuming from", currentTimeRef.current);
  setIsTimerRunning(true);

 timerRef.current = setInterval(() => {
  if (hasEndedRef.current || currentTimeRef.current === null) return;

  const next = currentTimeRef.current - 1;
  currentTimeRef.current = next;
  setTimeLeft(next);

  if (next <= 0) {
    hasEndedRef.current = true;
    clearInterval(timerRef.current!);
    timerRef.current = null;
    currentTimeRef.current = null;

    console.log("⏰ Time finished - Starting evaluation...");
    // setInterviewEnded(true);
    // stopCamera();

    // setMessages((prev) => [...prev, { 
    //   text: "⌛ Time's up! Interview ended automatically.", 
    //   isBot: true 
    // }]);

    // // Directly call evaluation
    // handleEvaluate().then(() => {
    //   setTimeout(() => {
    //     window.location.href = "/congratulations";
    //   }, 2000);
    // });

    finishInterview();
  }
}, 1000);
};
// In endInterviewDueToTime – keep your existing logs + force redirect
// const endInterviewDueToTime = async () => {
//   console.log("🔴 [TIMER END] Time's up - ending interview");

//   setInterviewEnded(true);
//   setIsTimerRunning(false);
//   stopCamera();

//   setMessages((prev) => [
//     ...prev,
//     { text: "⌛ Time's up! Interview ended automatically.", isBot: true },
//   ]);

//   console.log("🔴 [TIMER END] Now calling handleEvaluate...");
//   await handleEvaluate();

//   console.log("🔴 [TIMER END] Redirecting to congratulations in 2 seconds...");
//   setTimeout(() => {
//     window.location.href = "/congratulations";
//   }, 2000);
// };



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
            delegate: "GPU",
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
  const relevantSamples = emotionSamples.slice(Math.floor(emotionSamples.length * 0.3));

  const avgSmile = relevantSamples.reduce((sum, s) => sum + s.smile, 0) / relevantSamples.length;
  const avgStress = relevantSamples.reduce((sum, s) => sum + s.stress, 0) / relevantSamples.length;
  const avgConfidence = relevantSamples.reduce((sum, s) => sum + s.conf, 0) / relevantSamples.length;

  // Simple weighted formula (you can tweak weights easily)
  const presenceScore = Math.round(
    avgSmile * 0.45 + 
    (100 - avgStress) * 0.35 + 
    avgConfidence * 0.20
  );

  // Clamp between 30 and 98
  return Math.max(30, Math.min(98, presenceScore));
};
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
      resumeTimer();
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
    if (cleanTopic) {
      setMessages([
        {
          text: `Great! You've selected **"${cleanTopic}"**.\n\nNext:\n1. Choose difficulty\n2. Choose duration\n3. Type **"start"** when ready (camera & mic will activate)`,
          isBot: true,
        },
      ]);
      setShowDifficulty(true);
    } else if (customTopic) {
      // ← NEW: Resume was uploaded
      setMessages([
        {
          text: `✅ Resume loaded! Auto topic set to **"${customTopic}"**\n\nNow:\n1. Choose difficulty\n2. Choose duration\n3. Type **"start"**`,
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
      const res = await fetch("https://novatech-z95h.onrender.com/api/chat", {
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

     if (
  data.reply.toLowerCase().includes("interview complete") ||
  data.reply.includes("ended")
) {
  setInterviewEnded(true);
  stopCamera();
  console.log("⏳ AI said interview complete - calling handleEvaluate...");
  await handleEvaluate();
}
    } catch (err) {
      setMessages((p) => [
        ...p,
        { text: "Network error. Try again.", isBot: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const finishInterview = async () => {
  if (hasEndedRef.current) return;

  console.log("🛑 Finishing interview...");
  hasEndedRef.current = true;

  setInterviewEnded(true);
  setIsTimerRunning(false);
  stopCamera();

  setMessages((prev) => [
    ...prev,
    { text: "⌛ Time's up! Interview ended.", isBot: true },
  ]);

  await handleEvaluate();

  console.log("✅ Evaluation done, redirecting...");
  setTimeout(() => {
    window.location.href = "/congratulations";
  }, 2000);
};

  // ── New: Evaluation handler ────────────────────────────────────────
// ── Clean & Reliable handleEvaluate ─────────────────────────────────────
// ── Highly Debugged handleEvaluate ─────────────────────────────────────
const handleEvaluate = async () => {
  console.log("🚀 handleEvaluate START");

  if (hasEvaluatedRef.current) {
    console.log("⏭️ Already evaluated");
    return;
  }

  hasEvaluatedRef.current = true;

  try {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
      console.error("⏰ Evaluation request TIMEOUT");
    }, 8000);

    const response = await fetch(
      "https://novatech-z95h.onrender.com/api/evaluate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          sessionId,
          topic: cleanTopic || customTopic || "Full Stack Development",
          difficulty: selectedDifficulty || "Medium",
        }),
      }
    );

    clearTimeout(timeout);

    console.log("📥 Response:", response.status);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText);
    }

    const aiScores = await response.json();
    console.log("✅ Scores:", aiScores);

    localStorage.setItem("interviewScores", JSON.stringify({
      overall: aiScores.overall || 0,
      technical: aiScores.technical_accuracy || 0,
      communication: aiScores.communication || 0,
      problem_solving: aiScores.problem_solving || 0,
      strengths: aiScores.strengths || [],
      weaknesses: aiScores.weaknesses || [],
      feedback: aiScores.feedback || "No feedback available.",
    }));

    const presence = calculateFinalPresenceScore();
    localStorage.setItem("presenceScore", presence.toString());

    console.log("💾 Saved all scores");

  } catch (err) {
    console.error("❌ Evaluation failed:", err);

    const presence = calculateFinalPresenceScore();
    localStorage.setItem("presenceScore", presence.toString());

    console.log("⚠️ Fallback: Only presence score saved");
  }
};
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || interviewEnded) return;

    const text = input.trim().toLowerCase();

    // Special case: User types "start"
    if (text === "start" && !interviewStarted) {
      if (!selectedDifficulty || !selectedDuration) {
        setMessages((p) => [
          ...p,
          { text: "Please select difficulty and duration first.", isBot: true },
        ]);
        return;
      }

      const finalTopic = cleanTopic || customTopic || "Full Stack Development";

      setInterviewStarted(true);
      startCamera();
      startInterviewTimer(selectedDuration * 60);

      setMessages((p) => [
        ...p,
        {
          text: `🚀 Starting ${selectedDifficulty} interview on **${finalTopic}** using your resume...`,
          isBot: true,
        },
      ]);

      // sendToBackend(`start ${selectedDifficulty} ${finalTopic} ${selectedDuration}min`);
      sendToBackend("start"); // ← ONLY "start" (important!)
      setInput("");
      return;
    }

    // If user is typing topic manually (when no resume or customTopic)
    if (!cleanTopic && !customTopic && !interviewStarted) {
      setCustomTopic(input.trim());
      setMessages((prev) => [
        ...prev,
        { text: input.trim(), isBot: false },
        {
          text: `Perfect! Topic set to **"${input.trim()}"**\nNow choose difficulty & duration then type "start"`,
          isBot: true,
        },
      ]);
      setShowDifficulty(true);
      setInput("");
      return;
    }

    // ← Normal message during interview
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
          text: `✅ Resume parsed successfully!\n📊 ${fullText.length} characters extracted\n\n🎯 **Topic auto-detected:** ${autoTopic}\n\nNow select difficulty + duration and type "start"`,
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
            {interviewStarted && timeLeft !== null && (
              <Badge
                variant="outline"
                className="px-4 py-2 text-base font-mono"
              >
                {formatTime(timeLeft)}
              </Badge>
            )}

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
        {!interviewStarted && (
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
                  <strong className="text-purple-600 font-semibold">
                    "start"
                  </strong>{" "}
                  below to begin the interview
                </p>
              ) : (
                <p>Please select difficulty and duration to continue</p>
              )}
            </div>
          </Card>
        )}
        {!cleanTopic && !customTopic && (
          <div className="mb-6">
            <label className="block text-lg font-medium mb-2">
              Upload your Resume (PDF)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleResumeUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {isParsing && (
              <p className="text-purple-600 mt-2">Parsing resume...</p>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT: Chat */}
          <Card className="h-[82vh] flex flex-col bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
            {cameraActive && (
              <div
                className="absolute top-3 left-3 bg-black/65 text-white text-sm px-3 py-2 rounded-md font-mono z-10 shadow"
                style={{ marginLeft: "-10pc" }}
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
            )}
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

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    className={`max-w-xl ${
                      msg.isBot
                        ? "bg-gray-100 dark:bg-white/10"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                    } px-6 py-4 rounded-2xl shadow-lg text-lg whitespace-pre-line`}
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
{/* Temporary Test Button - Remove later */}
{interviewStarted && !interviewEnded && (
  <div className="p-4 border-t bg-yellow-100 dark:bg-yellow-900/30">
    <Button 
      onClick={async () => {
        console.log("🧪 Test Button Clicked - Calling handleEvaluate");
        setInterviewEnded(true);
        stopCamera();
        await handleEvaluate();
        setTimeout(() => window.location.href = "/congratulations", 1500);
      }}
      className="w-full bg-red-600 hover:bg-red-700"
    >
      🧪 TEST: Run handleEvaluate Now
    </Button>
  </div>
)}
            <div className="p-6 border-t">
              <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                <Button
                  type="button"
                  size="lg"
                  variant={isListening ? "default" : "outline"}
                  onClick={toggleVoiceInput}
                  className={`gap-2 ${isListening ? "bg-red-600 hover:bg-red-700 animate-pulse" : ""}`}
                  disabled={isPaused || interviewEnded}
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
                        : "Select options above, then type 'start' to begin"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-32 resize-none flex-1"
                  disabled={isPaused || interviewEnded}
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
            </div>
          </Card>

          {/* RIGHT: Video + overlay states */}
          <div className="space-y-6">
            <Card className="rounded-2xl overflow-hidden shadow-2xl bg-gray-900 relative">
              <div className="relative aspect-video" style={{ height: "34pc" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />

                {/* Before interview started */}
                {!interviewStarted && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-40">
                    <p className="text-white text-3xl font-bold text-center px-8">
                      Camera will start automatically when you type "start"
                    </p>
                  </div>
                )}

                {/* Camera manually off */}
                {interviewStarted && !isCameraOn && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
                    <p className="text-white text-3xl font-bold">
                      CAMERA MANUALLY TURNED OFF
                    </p>
                  </div>
                )}

                {interviewStarted && timeLeft !== null && (
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-base font-mono"
                  >
                    {interviewEnded ? "00:00" : formatTime(timeLeft)}
                  </Badge>
                )}

                {/* Final score overlay */}
                {interviewEnded && finalScore !== null && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white z-50">
                    <h2 className="text-4xl font-bold mb-6">
                      Interview Complete
                    </h2>
                    <p className="text-7xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      {finalScore}%
                    </p>
                    <p className="text-2xl mt-4">Presence & Confidence Score</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Pause modal – same style */}
      {(showMultiFaceModal || showSuspiciousObjectModal) && (
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
      )}

      {/* Exit button */}
      <button className="rounded-lg text-black bg-slate-500 hover:bg-slate-600 w-28 h-12 fixed bottom-8 right-8 flex items-center justify-center shadow-lg pl-3 text-base font-medium">
        <Link href="/congratulations">Exit</Link>
        <MoveRight className="ml-3 h-5 w-5" />
      </button>
      {resumeText && (
        <Badge variant="outline" className="ml-2 bg-green-950 text-green-300">
          Resume loaded ({(resumeText.length / 1000).toFixed(1)} k chars)
        </Badge>
      )}
    </div>
  );
}
