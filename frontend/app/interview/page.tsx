// app/interview/room/page.tsx
"use client";

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
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function InterviewRoom() {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "ai" | "user"; content: string }>
  >([
    {
      role: "ai",
      content:
        "Hello! I'm Nova, your AI interviewer. Click 'Start Interview' to begin your live technical round.",
    },
  ]);
  const [input, setInput] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Start camera + mic
  const startInterview = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: true,
      });

      setStream(mediaStream);
      setIsCameraOn(true);
      setIsMicOn(true);
      setInterviewStarted(true);

      if (videoRef.current && mediaStream) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(console.error);
        videoRef.current.play().catch((err) => {
          console.error("Play failed:", err);
          alert(
            "Camera loaded but video blocked. Try allowing autoplay in browser settings."
          );
        });
      }

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content:
              "Camera & mic connected! Let's start.\n\nQuestion 1: Explain the difference between React Server Components and Client Components.",
          },
        ]);
      }, 1500);
    } catch (err) {
      alert("Camera/microphone access denied. Please allow permissions.");
      console.error(err);
    }
  };

  // Toggle Camera (only works after stream exists)
  const toggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  // Toggle Mic
  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setInput("");

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Great answer! Next question coming up...",
        },
      ]);
    }, 2000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Pre-interview screen
  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/60 flex items-center justify-center p-6">
        <div className="text-center space-y-10">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Bot className="w-16 h-16 text-white" />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Interview Room
          </h1>
          <p className="text-xl text-muted-foreground">
            Live video + voice required
          </p>
          <Button
            size="lg"
            onClick={startInterview}
            className="h-20 px-16 text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl"
          >
            <Video className="mr-4 h-8 w-8" />
            Start Interview
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/40">
      <div className="container max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Badge className="px-5 py-2 text-lg bg-green-100 text-green-700 dark:bg-green-900/50">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live Interview
            </Badge>
            <h2 className="text-2xl font-bold">Senior React Engineer</h2>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={toggleCamera}
              className="gap-2"
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
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* LEFT: Chat */}
          <Card className="h-[82vh] flex flex-col bg-white/90 dark:bg-black/70 backdrop-blur-xl border border-gray-200/50 dark:border-white/10">
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
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-4 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "ai" && (
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                        N
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-xl ${
                      msg.role === "user" ? "text-right" : ""
                    }`}
                  >
                    <div
                      className={`
                      inline-block px-6 py-4 rounded-2xl shadow-lg text-lg whitespace-pre-line
                      ${
                        msg.role === "ai"
                          ? "bg-purple-50 dark:bg-purple-900/40 border border-purple-200/50"
                          : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                      }
                    `}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {/* AI typing */}
              <div className="flex gap-4">
                <Avatar>
                  <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                    N
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 dark:bg-white/10 rounded-2xl px-6 py-4">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce" />
                    <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce delay-100" />
                    <div className="w-3 h-3 bg-gray-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t">
              <div className="flex gap-4 items-end">
                <Button
                  size="lg"
                  variant={isMicOn ? "outline" : "destructive"}
                  onClick={toggleMic}
                >
                  {isMicOn ? (
                    <Mic className="h-6 w-6" />
                  ) : (
                    <MicOff className="h-6 w-6" />
                  )}
                </Button>
                <Textarea
                  placeholder="Type your answer here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  className="min-h-32 resize-none"
                />
                <Button
                  size="lg"
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </div>
            </div>
          </Card>

          {/* RIGHT: Live Video */}
          {/* DIAGNOSTIC VIDEO — WILL PROVE CAMERA WORKS */}
          <div className="space-y-6">
            <Card className="rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
              <div className="relative aspect-video">
                {/* THIS IS THE TEST VIDEO */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1] border-8 border-green-500"
                  style={{ background: "#ff00ff" }} // bright magenta so you KNOW it's the video
                />

                {/* DEBUG OVERLAYS — YOU WILL SEE THESE */}
                <div className="absolute top-4 left-4 z-50 bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-xl shadow-2xl">
                  CAMERA IS ACTIVE
                </div>
                <div className="absolute bottom-4 left-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-2xl">
                  STREAM: {stream ? "CONNECTED" : "NO STREAM"}
                </div>
                <div className="absolute bottom-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-2xl">
                  TRACKS: {stream?.getVideoTracks().length || 0}
                </div>

                {/* Camera off overlay */}
                {!isCameraOn && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
                    <p className="text-white text-3xl font-bold">
                      CAMERA MANUALLY TURNED OFF
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-white/90 dark:bg-black/70 backdrop-blur-xl">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                Live AI Feedback
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Confidence Score</span>
                    <span className="font-bold text-green-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-white/20 rounded-full h-4">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full w-[92%]" />
                  </div>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clarity</span>
                    <span className="font-medium">Excellent</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Structure</span>
                    <span className="font-medium">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Depth</span>
                    <span className="font-medium text-purple-600">
                      Advanced
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
