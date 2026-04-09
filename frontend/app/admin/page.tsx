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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export default function AdminDashboard() {
  const { isAdmin, authorizationToken } = useAuth();

  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAdmins: 0,
    newUsersThisMonth: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  }, [isAdmin, authorizationToken]);

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
              <Trophy className="h-5 w-5" /> User Leaderboard
            </CardTitle>
            <CardDescription>Recently joined users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="text-left py-3">Username</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Select</th>
                    <th className="text-center py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user) => (
                    <tr key={user._id} className="border-b border-border/50 transition hover:bg-muted/40">
                      <td className="py-3 font-medium">{user.username}</td>
                      <td className="py-3 text-muted-foreground">
                        {user.email}
                      </td>
                      <td className="py-3 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-center">
                        {user.isAdmin ? "✅" : "❌"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        <CardContent className="h-[400px]">
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
        </CardContent>
      </Card>
    </div>
  );
}
