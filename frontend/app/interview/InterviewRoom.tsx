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
  MoveRight,
  Sparkles,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

interface Message {
  text: string;
  isBot: boolean;
}
interface InterviewRoomProps {
  selectedTopic: string | null; // Important: allow null
}
export default function InterviewRoom({ selectedTopic }: InterviewRoomProps) {
  //   const searchParams = useSearchParams();
  //   const selectedTopic = searchParams.get("topic");
  const cleanTopic = selectedTopic ? decodeURIComponent(selectedTopic) : null;
  const [questionStartTime, setQuestionStartTime] = useState<number | null>(
    null
  );
  const [typingTimerId, setTypingTimerId] = useState<NodeJS.Timeout | null>(
    null
  );
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Welcome! Please choose an interview topic to begin:",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isListening, setIsListening] = useState(false); // NEW: Speech recognition state

  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null); // SpeechRecognition instance

  //   useEffect(() => {
  //     if (selectedTopic && !interviewStarted) {
  //       const cleanTopic = decodeURIComponent(selectedTopic);
  //       setMessages([
  //         {
  //           text: `Great! You've selected the topic:\n\n**"${cleanTopic}"**\n\nI'll ask you interview questions about this. Please allow camera & mic to begin!`,
  //           isBot: true,
  //         },
  //       ]);
  //     }
  //   }, [selectedTopic, interviewStarted]);
  useEffect(() => {
    if (cleanTopic && !interviewStarted) {
      setMessages([
        {
          text: `Great! You've selected the topic:\n\n**"${cleanTopic}"**\n\nI'll ask you interview questions about this. Please allow camera & mic to begin!`,
          isBot: true,
        },
      ]);
    }
  }, [cleanTopic, interviewStarted]); // ← dependency is cleanTopic, not selectedTopic

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // === Speech Recognition Setup ===
  useEffect(() => {
    if (
      !("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    let finalTranscript = "";

    recognition.onresult = (event: any) => {
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart + " ";
        } else {
          interimTranscript += transcriptPart;
        }
      }

      setInput(finalTranscript.trim() + " " + interimTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "no-speech") {
        // Optional: alert("No speech detected. Try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const sendMessage = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg) return;

    if (typingTimerId) {
      clearTimeout(typingTimerId);
      setTypingTimerId(null);
    }

    setMessages((prev) => [...prev, { text: userMsg, isBot: false }]);
    setInput("");

    try {
      const res = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat: userMsg,
          topic: cleanTopic,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        setMessages((prev) => {
          const timer = setTimeout(() => {
            setMessages((m) => [
              ...m,
              {
                text: "Taking a bit long? Here's the next question to keep momentum!",
                isBot: true,
              },
            ]);
            sendMessage("continue");
          }, 60000);

          setTypingTimerId(timer);
          setQuestionStartTime(Date.now());

          return [...prev, { text: data.reply, isBot: true }];
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

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
    } catch (err: any) {
      console.error("Media access failed:", err);
      alert(
        `Failed to access camera/mic: ${err.message || "Permission denied"}`
      );
    }
  };

  const toggleCamera = () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !isCameraOn;
      setIsCameraOn(!isCameraOn);
    }
  };

  const toggleMic = () => {
    if (!stream) return;
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  // Video stream assignment
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current
        .play()
        .catch((err) => console.error("Video play failed:", err));
    }
  }, [stream]);

  // Cleanup
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [stream]);
  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-950 dark:to-purple-950/60 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl mb-8">
              <Bot className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
              AI Interview Room
            </h1>
            <p className="text-xl text-muted-foreground">
              Prepare for a realistic, professional interview experience
            </p>
            <p className="text-xl text-muted-foreground">Judge yourself</p>
          </div>

          {/* Rules & Tips Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Rules Card */}
            <Card className="p-8 bg-white/80 dark:bg-black/60 backdrop-blur border border-gray-200/50 dark:border-white/10">
              <h2 className="text-3xl font-bold mb-6 text-purple-700 dark:text-purple-400 flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Interview Rules
              </h2>
              <ul className="space-y-5 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex gap-4">
                  <span className="text-2xl">📹</span>
                  <div>
                    <strong>Camera must be ON</strong> throughout the interview
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">🎤</span>
                  <div>
                    <strong>Microphone must be ON</strong> and clear (no
                    background noise)
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">👀</span>
                  <div>Keep your face clearly visible in the frame</div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">⏰</span>
                  <div>
                    Answer each question thoughtfully within 2-3 minutes
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">🚫</span>
                  <div>No external help, notes, or searching allowed</div>
                </li>
              </ul>
            </Card>

            {/* Tips Card */}
            <Card className="p-8 bg-white/80 dark:bg-black/60 backdrop-blur border border-gray-200/50 dark:border-white/10">
              <h2 className="text-3xl font-bold mb-6 text-pink-700 dark:text-pink-400 flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                Pro Tips for Success
              </h2>
              <ul className="space-y-5 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex gap-4">
                  <span className="text-2xl">🌿</span>
                  <div>Find a quiet, well-lit room with neutral background</div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">🪑</span>
                  <div>Sit upright, maintain eye contact with the camera</div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">💡</span>
                  <div>Speak clearly and at a moderate pace</div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">🧠</span>
                  <div>
                    Use the STAR method (Situation, Task, Action, Result) for
                    behavioral questions
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="text-2xl">😊</span>
                  <div>Smile naturally and show enthusiasm!</div>
                </li>
              </ul>
            </Card>
          </div>

          {/* Topic Display */}
          {cleanTopic && (
            <div className="text-center mb-10">
              <p className="text-xl text-muted-foreground mb-2">
                Your selected topic:
              </p>
              <Badge className="text-2xl px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                {cleanTopic}
              </Badge>
            </div>
          )}

          {/* Start Button */}
          <div className="text-center">
            <Button
              size="lg"
              onClick={startInterview}
              className="h-20 px-20 text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-2xl transform transition hover:scale-105"
            >
              <Video className="mr-6 h-10 w-10" />
              Start Interview Now
            </Button>

            <p className="mt-6 text-lg text-muted-foreground">
              By starting, you agree to keep camera and microphone on during the
              entire session.
            </p>
          </div>
        </div>
      </div>
    );
  }
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

            {/* Input Area - Now with Voice Button */}
            <div className="p-6 border-t">
              <form onSubmit={handleSubmit} className="flex gap-4 items-end">
                {/* Voice Input Button */}
                <Button
                  type="button"
                  size="lg"
                  variant={isListening ? "default" : "outline"}
                  onClick={toggleVoiceInput}
                  className={`gap-2 ${
                    isListening
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : ""
                  }`}
                >
                  <Mic className="h-6 w-6" />
                  {isListening ? "Listening..." : "Speak"}
                </Button>

                {/* Mic Toggle */}
                <Button
                  type="button"
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

                {/* Text Input */}
                <Textarea
                  placeholder="Type your answer or click 'Speak' to dictate..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="min-h-32 resize-none flex-1"
                />

                {/* Send Button */}
                <Button
                  type="submit"
                  size="lg"
                  disabled={!input.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Send className="h-6 w-6" />
                </Button>
              </form>

              {/* Listening Feedback */}
              {isListening && (
                <p className="text-center mt-4 text-green-600 font-semibold animate-pulse">
                  🎤 Listening... Speak clearly!
                </p>
              )}
            </div>
          </Card>

          {/* RIGHT: Video */}
          <div className="space-y-6">
            <Card className="rounded-2xl overflow-hidden shadow-2xl bg-gray-900">
              <div className="relative aspect-video" style={{ height: "34pc" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                {/* Debug overlays - remove in production */}
                <div className="absolute top-4 left-4 z-50 bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold text-xl shadow-2xl">
                  CAMERA IS ACTIVE
                </div>
                <div className="absolute bottom-4 left-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-2xl">
                  STREAM: {stream ? "CONNECTED" : "NO STREAM"}
                </div>
                <div className="absolute bottom-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg font-bold text-xl shadow-2xl">
                  TRACKS: {stream?.getVideoTracks().length || 0}
                </div>

                {!isCameraOn && (
                  <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40">
                    <p className="text-white text-3xl font-bold">
                      CAMERA MANUALLY TURNED OFF
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      <button className="rounded-lg text-black bg-slate-500 hover:bg-slate-600 w-20 h-10 fixed bottom-8 right-8 flex items-center justify-center shadow-lg pl-2">
        Exit
        <MoveRight className="ml-5" />
      </button>
    </div>
  );
}
