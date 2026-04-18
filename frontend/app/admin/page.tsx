// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, TrendingUp, Shield, Trophy, Plus } from "lucide-react";
import { useAuth } from "@/app/Auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalUsers: number;
  totalAdmins: number;
  newUsersThisMonth: number;
}

interface User {
  _id: string;
  username: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
}

interface InterviewTopic {
  _id: string;
  topicName: string;
  isDemoTopic?: boolean;
}

interface LeaderboardEntry {
  candidateName: string;
  topic: string;
  finalScore: number;
  overall: number;
  presenceScore: number;
  difficulty: string;
  createdAt: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://virtual-interview-32pw.onrender.com";
const DEMO_TOPIC_NAMES = new Set([
  "react",
  "system design",
  "javascript",
  "node.js",
  "mongodb",
  "typescript",
  "sql",
]);

export default function AdminDashboard() {
  const { isAdmin, authorizationToken } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAdmins: 0,
    newUsersThisMonth: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<InterviewTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  const isDemoTopic = (topic?: InterviewTopic) => {
    if (!topic) return false;
    return Boolean(topic.isDemoTopic) || DEMO_TOPIC_NAMES.has(topic.topicName.trim().toLowerCase());
  };

  // Form State for Interview Topic
  const [newTopic, setNewTopic] = useState({
    topicName: "",
    description: "",
    image: "",
    date: "",
  });

  // Chart Data
  const userGrowthData = [
    { month: "Jan", users: 1240 },
    { month: "Feb", users: 1890 },
    { month: "Mar", users: 2340 },
    { month: "Apr", users: 3120 },
    { month: "May", users: 3780 },
    { month: "Jun", users: 4520 },
    { month: "Jul", users: 4890 },
  ];

  const fetchStats = async () => {
    if (!authorizationToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
        headers: { Authorization: authorizationToken },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchUsers = async () => {
    if (!authorizationToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { Authorization: authorizationToken },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/topics`);
      if (res.ok) {
        const data = await res.json();
        const topicsArray = Array.isArray(data) ? data : (data.topics || []);
        setTopics(topicsArray);
        if (topicsArray.length > 0) {
          setSelectedTopic(topicsArray[0].topicName);
        }
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error("Failed to fetch topics", error);
      setTopics([]);
    }
  };

  const fetchLeaderboard = async (topic: string) => {
    if (!topic) return;
    setLeaderboardLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/leaderboard?topic=${encodeURIComponent(topic)}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        const leaderboardArray = Array.isArray(data) ? data : (data.leaderboard || []);
        setLeaderboard(leaderboardArray);
      } else {
        setLeaderboard([]);
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard", error);
      setLeaderboard([]);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.topicName || !newTopic.description) {
      alert("Topic Name and Description are required!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/topics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorizationToken,
        },
        body: JSON.stringify(newTopic),
      });

      if (res.ok) {
        alert("✅ Interview Topic Added Successfully!");
        setNewTopic({ topicName: "", description: "", image: "", date: "" });
      } else {
        alert("Failed to add topic");
      }
    } catch (error) {
      console.error(error);
      alert("Error adding topic");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchUsers();
      fetchTopics();
    }
  }, [isAdmin, authorizationToken]);

  useEffect(() => {
    if (selectedTopic) {
      fetchLeaderboard(selectedTopic);
    }
  }, [selectedTopic]);

  return (
    <div className="container mx-auto space-y-10 px-4 py-10 md:px-6 md:py-12">
      <div className="animate-fade-up rounded-3xl border border-border/60 bg-gradient-to-br from-sky-500/10 via-transparent to-emerald-500/10 p-6 md:p-8">
        <h1 className="text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Virtual Interview Platform Overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="glass-panel animate-fade-up rounded-2xl" style={{ animationDelay: "80ms" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="glass-panel animate-fade-up rounded-2xl" style={{ animationDelay: "140ms" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              New This Month
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{stats.newUsersThisMonth}</div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="glass-panel animate-fade-up rounded-2xl" style={{ animationDelay: "200ms" }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-5 w-5 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold tracking-tight">{stats.totalAdmins}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Leaderboard */}
        <Card className="glass-panel animate-fade-up rounded-2xl" style={{ animationDelay: "260ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" /> Interview Leaderboard
              {selectedTopic && isDemoTopic(topics.find((t) => t.topicName === selectedTopic)) && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-semibold ml-2">
                  DEMO TOPIC
                </span>
              )}
            </CardTitle>
            <CardDescription>Top performers by interview topic</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-filter">Select Topic</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger id="topic-filter" className="rounded-xl">
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic._id} value={topic.topicName}>
                      {topic.topicName}
                      {isDemoTopic(topic) ? " (Demo)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Topics marked with DEMO are demo interview topics.</p>
            </div>

            {leaderboardLoading ? (
              <div className="text-center py-6 text-muted-foreground">
                Loading leaderboard...
              </div>
            ) : leaderboard.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left py-3">Rank</th>
                      <th className="text-left py-3">Candidate</th>
                      <th className="text-left py-3">Difficulty</th>
                      <th className="text-center py-3">Overall</th>
                      <th className="text-center py-3">Presence</th>
                      <th className="text-center py-3">Final Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry, index) => (
                      <tr key={index} className="border-b border-border/50 transition hover:bg-muted/40">
                        <td className="py-3">
                          <span className="font-bold">#{index + 1}</span>
                        </td>
                        <td className="py-3 font-medium">{entry.candidateName}</td>
                        <td className="py-3 text-muted-foreground text-sm">{entry.difficulty}</td>
                        <td className="py-3 text-center">{entry.overall?.toFixed(1) || "N/A"}</td>
                        <td className="py-3 text-center">{entry.presenceScore?.toFixed(1) || "N/A"}</td>
                        <td className="py-3 text-center font-bold text-green-600">
                          {entry.finalScore?.toFixed(1) || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No leaderboard data for this topic yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Interview Topic Form */}
        <Card className="glass-panel animate-fade-up rounded-2xl" style={{ animationDelay: "320ms" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Interview Topic
            </CardTitle>
            <CardDescription>Create a new topic for interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <Label className="mb-2 inline-block">Topic Name *</Label>
                <Input
                  value={newTopic.topicName}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, topicName: e.target.value })
                  }
                  placeholder="e.g. React.js Advanced Concepts"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label className="mb-2 inline-block">Description *</Label>
                <Textarea
                  value={newTopic.description}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, description: e.target.value })
                  }
                  placeholder="Detailed description of the interview topic..."
                  className="rounded-xl"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label className="mb-2 inline-block">Image URL (Optional)</Label>
                <Input
                  value={newTopic.image}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label className="mb-2 inline-block">Date (Optional)</Label>
                <Input
                  type="date"
                  value={newTopic.date}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, date: e.target.value })
                  }
                  className="rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
                Add Interview Topic
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* User Signup Trend Chart */}
      <Card className="glass-panel animate-fade-up rounded-2xl" style={{ animationDelay: "380ms" }}>
        <CardHeader>
          <CardTitle>User Sign-up Trend</CardTitle>
          <CardDescription>Monthly growth in registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full" style={{ height: "400px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
