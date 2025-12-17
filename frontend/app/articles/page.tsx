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
    src:"https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d2ViJTIwZGVzaWdufGVufDB8fDB8fHww",
    title: "The Future of Web Development in 2025",
    excerpt: "React Server Components, AI-assisted coding, edge runtime, and what it all means for developers.",
    author: "Amisha Nishankar",
    avatar: "/avatar.jpg",
    date: "2025-12-04",
    readTime: "8 min",
    category: "Future",
    featured: true,
  },
  {
    id: 2,
    title: "Mastering TypeScript: Advanced Patterns",
    src:"https://images.unsplash.com/photo-1568716353609-12ddc5c67f04?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHlwZSUyMHNjcmlwdCUyMGluJTIwamF2YXxlbnwwfHwwfHx8MA%3D%3D",
    excerpt: "Explore advanced TypeScript patterns to write safer and more maintainable code.",
    author: "Amisha Nishankar",
    date: "2025-12-02",
    readTime: "12 min",
    category: "TypeScript",
  },
  {
    id: 3,
        src:"https://images.unsplash.com/photo-1690683789978-3cf73960d650?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fHB5dGhvbnxlbnwwfHwwfHx8MA%3D%3D",
    title: "Specialization in AI",
    excerpt: "An in-depth guide to Python's latest features for AI and machine learning development.",
    author: "Amisha Nishankar",
    date: "2025-11-30",
    readTime: "7 min",
    category: "Accessibility",
  },
  {
    id: 4,
    title: "Specialization in DataScience",
    src:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZGF0YSUyMHNjaWVuY2V8ZW58MHx8MHx8fDA%3D",
    excerpt: "A specialization course on DataScience using Java and its applications.",
    author: "Amisha Nishankar",
    date: "2025-11-25",
    readTime: "10 min",
    category: "Next.js",
  },
  {
    id: 5,
    title: "specializaition in Cybersecurity",
    src:"https://media.istockphoto.com/id/2020157664/photo/cyber-security-network-cybersecurity-concept-global-network-security-technology-business.webp?a=1&b=1&s=612x612&w=0&k=20&c=3dJ_LcKoMA7sEzkX3e6W-DEiyz3RCfPrwmzTmjUS4SM=",
    excerpt: "A comprehensive guide to modern cybersecurity practices and protocols.",
    author: "Amisha Nishankar",
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
    <div className="container max-w-6xl px-4 py-12 md:py-16 mx-auto">
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
                <div className="bg-muted border-2 border-dashed rounded-xl aspect-video mb-4">
                 {post.src ? <img className="rounded-xl" style={{"width":"100%","height":"100%"}} src={post.src}/> : null}
                  
                  </div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback>AN</AvatarFallback>
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
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/interview?topic=${encodeURIComponent(post.title)}`}>
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