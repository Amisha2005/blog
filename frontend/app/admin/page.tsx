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
    <div className="p-6 md:p-10 space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Virtual Interview Platform Overview
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">
              New This Month
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.newUsersThisMonth}</div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{stats.totalAdmins}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leaderboard */}
        <Card>
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
                  <tr className="border-b">
                    <th className="text-left py-3">Username</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Select</th>
                    <th className="text-center py-3">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user) => (
                    <tr key={user._id} className="border-b hover:bg-muted/50">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" /> Add New Interview Topic
            </CardTitle>
            <CardDescription>Create a new topic for interviews</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTopic} className="space-y-4">
              <div>
                <Label>Topic Name *</Label>
                <Input
                  value={newTopic.topicName}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, topicName: e.target.value })
                  }
                  placeholder="e.g. React.js Advanced Concepts"
                  required
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea
                  value={newTopic.description}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, description: e.target.value })
                  }
                  placeholder="Detailed description of the interview topic..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label>Image URL (Optional)</Label>
                <Input
                  value={newTopic.image}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, image: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <Label>Date (Optional)</Label>
                <Input
                  type="date"
                  value={newTopic.date}
                  onChange={(e) =>
                    setNewTopic({ ...newTopic, date: e.target.value })
                  }
                />
              </div>

              <Button type="submit" className="w-full">
                Add Interview Topic
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* User Signup Trend Chart */}
      <Card>
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
