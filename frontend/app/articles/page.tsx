// app/articles/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Mock data — replace with real posts from CMS/MDX later
const allPosts = [
  {
    id: 1,
    title: "The Future of Web Development in 2025",
    excerpt: "React Server Components, AI-assisted coding, edge runtime, and what it all means for developers.",
    author: "Sarah Chen",
    avatar: "/avatar.jpg",
    date: "2025-12-04",
    readTime: "8 min",
    category: "Future",
    featured: true,
  },
  {
    id: 2,
    title: "Mastering TypeScript: Advanced Patterns",
    excerpt: "Conditional types, mapped types, and utility types that will level up your codebase.",
    author: "Sarah Chen",
    date: "2025-12-02",
    readTime: "12 min",
    category: "TypeScript",
  },
  {
    id: 3,
    title: "Building Accessible Forms with React",
    excerpt: "Best practices and common pitfalls when creating forms that work for everyone.",
    author: "Sarah Chen",
    date: "2025-11-30",
    readTime: "7 min",
    category: "Accessibility",
  },
  {
    id: 4,
    title: "Next.js 15: What's Actually New?",
    excerpt: "Deep dive into the latest features, performance improvements, and breaking changes.",
    author: "Sarah Chen",
    date: "2025-11-25",
    readTime: "10 min",
    category: "Next.js",
  },
  {
    id: 5,
    title: "Tailwind CSS Anti-Patterns to Avoid",
    excerpt: "Common mistakes developers make and how to write cleaner, maintainable styles.",
    author: "Sarah Chen",
    date: "2025-11-20",
    readTime: "6 min",
    category: "Design",
  },
];

const categories = ["All", "Next.js", "TypeScript", "Design", "Accessibility", "Future"];

export default function ArticlesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="container max-w-6xl px-4 py-12 md:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">All Articles</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          In-depth guides and thoughts on modern web development, design, and tooling.
        </p>
      </div>

      <Separator className="mb-12" />

      {/* Search + Filters */}
      <div className="mb-12 space-y-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="transition-all"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-muted-foreground">No articles found.</p>
          <Button variant="outline" className="mt-6" onClick={() => {
            setSearchQuery("");
            setSelectedCategory("All");
          }}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-muted border-2 border-dashed rounded-xl aspect-video mb-4" />
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback>SC</AvatarFallback>
                  </Avatar>
                  <div className="text-sm">
                    <p className="font-medium">{post.author}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit mb-2">
                  {post.category}
                </Badge>
                <CardTitle className="line-clamp-2 text-xl">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>

              <CardFooter className="mt-auto flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </span>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/interview">
                    try →
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Optional: Pagination (add later) */}
      {/* <div className="mt-16 flex justify-center">
        <Pagination>...</Pagination>
      </div> */}
    </div>
  );
}