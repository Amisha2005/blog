// app/signup/page.tsx
"use client";
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Github, Chrome, Mail, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "../Auth";
export default function SignUpPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => setMounted(true), []);

  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
  });
  const { storeTokenInLS } = useAuth();
  const handleInput = (e) => {
    let name = e.target.name;
    let value = e.target.value;
    setUser({ ...user, [name]: value });
  }
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(user);
    try {
      const response = await fetch("https://novatech-z95h.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      });
      const res_data = await response.json();
      console.log("res from server", res_data);
      if (response.ok) {
        const successMsg = "registration successful!";
        alert("successfully registered");
        // toast.success(successMsg);
        storeTokenInLS(res_data.token);
        setUser({ username: "", email: "", password: "" });
        router.push('/login');
      } else {
        // toast.error(res_data.extraDetails ? res_data.extraDetails : res_data.message);
      }
    } catch (error) {
      console.log("register", error);
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-950 dark:via-purple-950 dark:to-slate-900">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/20 dark:bg-purple-600/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-500/20 dark:bg-pink-600/25 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Grid background (dark mode only) */}
        <div className="absolute inset-0 bg-grid-black/5 dark:bg-grid-white/5 bg-grid-16 pointer-events-none hidden dark:block" />

        <Card className="relative w-full max-w-md shadow-2xl border border-gray-200/50 dark:border-white/10 bg-white/80 dark:bg-black/60 backdrop-blur-xl">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400/5 via-transparent to-pink-400/5 dark:from-purple-600/10 dark:to-pink-600/10 rounded-2xl" />

          <CardHeader className="relative z-10 text-center pt-10 pb-8">
            {/* Theme Toggle Button */}
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

            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
              <Sparkles className="w-9 h-9 text-white" />
            </div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Create your account
            </CardTitle>
            <CardDescription className="mt-3 text-base text-gray-600 dark:text-gray-400">
              Join thousands of developers mastering the future of web
            </CardDescription>
          </CardHeader>

          <CardContent className="relative z-10 space-y-6 pb-10 px-8">
            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="w-full h-12 font-medium border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur-sm"
              >
                <Chrome className="mr-2 h-5 w-5" />
                Google
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 font-medium border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur-sm"
              >
                <Github className="mr-2 h-5 w-5" />
                GitHub
              </Button>
            </div>

            <div className="relative">
              <Separator className="bg-gray-200 dark:bg-white/10" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-black px-4 text-xs font-medium text-gray-500 dark:text-gray-400">
                OR CONTINUE WITH EMAIL
              </span>
            </div>

            {/* Form */}
            <form className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  Full Name
                </Label>
                <Input
                  id="username"
                  name="username"
                  value={user.username}
                  type="text"
                  placeholder="Sarah Chen"
                  onChange={handleInput}
                  required
                  className="h-12 bg-gray-50/70 dark:bg-white/5 border-gray-300 dark:border-white/20 focus:border-purple-500 dark:focus:border-purple-400 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  value={user.email}
                  type="email"
                  placeholder="sarah@devcraft.io"
                  onChange={handleInput}
                  required
                  className="h-12 bg-gray-50/70 dark:bg-white/5 border-gray-300 dark:border-white/20 focus:border-purple-500 dark:focus:border-purple-400 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-gray-700 dark:text-gray-300 font-medium"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  value={user.password}
                  type="password"
                  placeholder="Create a strong password"
                  onChange={handleInput}
                  required
                  className="h-12 bg-gray-50/70 dark:bg-white/5 border-gray-300 dark:border-white/20 focus:border-purple-500 dark:focus:border-purple-400 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Must be 8+ characters with letters, numbers & symbols
                </p>
              </div>

              <Button
                size="lg"
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transform transition hover:scale-[1.02] active:scale-[0.98]"
                 onClick={handleSubmit}
                 >
                <Mail className="mr-2 h-5 w-5" />
                Sign Up with Email
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Log in
                </Link>
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-500 max-w-xs mx-auto leading-relaxed">
                By signing up, you agree to our{" "}
                <a
                  href="#"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
