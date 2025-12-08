// app/account/page.tsx
"use client";
import { useEffect } from "react";
import { useAuth } from "@/app/Auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { LogOut, Mail, User, Calendar, Edit2, Save, X } from "lucide-react";

export default function AccountPage() {
  const { user, LogoutUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(" ");
  const [email,setEmail] = useState(" ");
  const [bio, setBio] = useState("Full-stack developer | Next.js & Tailwind enthusiast");

useEffect(() => {
    if (user) {
      setName(user.name || user.username || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Please log in</CardTitle>
            <CardDescription>You need to be authenticated to view your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" asChild>
              <a href="/login">Go to Login</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-900 pt-20 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
            My Account
          </h1>
          <p className="text-muted-foreground text-lg">Manage your profile and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="overflow-hidden border-0 shadow-2xl bg-white/80 dark:bg-black/60 backdrop-blur-xl">
          <div className="h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 dark:from-purple-600 dark:via-pink-600 dark:to-cyan-600" />
          
          <CardContent className="relative -mt-16 pb-10">
            <div className="flex flex-col items-center sm:flex-row sm:items-end gap-6">
              <Avatar className="h-32 w-32 ring-8 ring-background shadow-2xl">
                <AvatarImage src="/avatar.jpg" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                 {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="text-center sm:text-left flex-1">
                <h2 className="text-3xl font-bold flex items-center gap-3 justify-center sm:justify-start">
                  {user.username}
                  <Badge variant="secondary" className="ml-2">Pro Member</Badge>
                </h2>
                <p className="text-muted-foreground flex items-center gap-2 justify-center sm:justify-start mt-1">
                  <Mail className="h-4 w-4" /> {user.email}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                  <Calendar className="h-4 w-4" /> Joined March 2025
                </p>
              </div>

              <Button
                size="lg"
                variant={isEditing ? "default" : "outline"}
                onClick={() => setIsEditing(!isEditing)}
                className="shadow-lg"
              >
                {isEditing ? (
                  <>
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </>
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Section */}
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14">
            <TabsTrigger value="profile" className="text-base">Profile</TabsTrigger>
            <TabsTrigger value="security" className="text-base">Security</TabsTrigger>
            <TabsTrigger value="preferences" className="text-base">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                   <Input value={email} disabled className="h-12" ></Input>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" placeholder="Confirm new password" />
                </div>
                <Button className="w-full sm:w-auto">Update Password</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates about your activity</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-muted-foreground">You&apos;re currently using dark mode</p>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Logout Button */}
        <div className="flex justify-center pt-10">
          <Button
            variant="destructive"
            size="lg"
            onClick={LogoutUser}
            className="shadow-xl hover:shadow-2xl transition-all"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout from Account
          </Button>
        </div>
      </div>
    </div>
  );
}