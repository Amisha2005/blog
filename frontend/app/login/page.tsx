// app/login/page.tsx
"use client";
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Github, Chrome, Mail, Sparkles, Sun, Moon, Lock } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "../Auth";
const URL = "https://novatech-z95h.onrender.com/api/auth/login";
export default function LoginPage() {
const router = useRouter(); // ← Add this line
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const[user,setUser]=useState({
    email:"",
    password:""
  });
  const {storeTokenInLS}=useAuth();
   const handleInput = (e) => {
    let name = e.target.name;
    let value = e.target.value;

    setUser({
      ...user,
      [name]: value,
    });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });
      console.log("login form", response);
      const res_data = await response.json();
      if (response.ok) {
        console.log('res from server',res_data);
        storeTokenInLS(res_data.token);
        console.log("login successful");
        setUser({
          email: "",
          password: "",
        });
     router.push('/');
      } else {
        console.log("invalid crediential");
      }
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 dark:bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/20 dark:bg-pink-600/25 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-cyan-500/10 dark:bg-cyan-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Grid overlay (dark mode only) */}
        <div className="absolute inset-0 bg-grid-black/5 dark:bg-grid-white/5 bg-grid-16 pointer-events-none hidden dark:block" />

        <Card className="relative w-full max-w-md shadow-2xl border border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-cyan-400/5 dark:from-purple-600/10 dark:to-cyan-600/10 rounded-2xl" />

          <CardHeader className="relative z-10 text-center pt-10 pb-8">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="absolute top-6 right-6 p-2 rounded-lg bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute inset-0 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>
            )}

            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-600 to-cyan-600 dark:from-purple-500 dark:to-cyan-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Lock className="w-8 h-8 text-white" />
            </div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Welcome back
            </CardTitle>
            <CardDescription className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Log in to continue your learning journey
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6 pb-10 px-8">
            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full h-12 font-medium border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Chrome className="mr-2 h-5 w-5" />
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 font-medium border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <Separator className="bg-gray-200 dark:bg-white/10" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black px-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                OR LOG IN WITH EMAIL
              </span>
            </div>

            {/* Login Form */}
            <form className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="sarah@devcraft.io"
                  name="email"
                  value={user.email}
                  onChange={handleInput}
                  required
                  className="h-12 bg-gray-50/70 dark:bg-white/5 border-gray-300 dark:border-white/20 focus:border-purple-500 dark:focus:border-purple-400 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-gray-700 dark:text-gray-300 font-medium">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  value={user.password}
                  onChange={handleInput}
                  placeholder="Enter your password"
                  required
                  className="h-12 bg-gray-50/70 dark:bg-white/5 border-gray-300 dark:border-white/20 focus:border-purple-500 dark:focus:border-purple-400 placeholder:text-gray-500"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 dark:border-gray-600" />
                <label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                  Keep me signed in
                </label>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98]"
                 
                 onClick={handleSubmit}
                 >
                <Mail className="mr-2 h-5 w-5" />
                Log In with Email
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don’t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                Sign up for free
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}