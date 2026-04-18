// app/articles/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, Calendar } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://virtual-interview-32pw.onrender.com";

interface InterviewTopic {
  _id: string;
  topicName: string;
  description: string;
  image: string;
  date: string;
  createdAt: string;
}

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
  const [topics, setTopics] = useState<InterviewTopic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const filteredPosts = allPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });


  // Fetch topics from backend
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/topics`);
        if (res.ok) {
          const data = await res.json();
          setTopics(data.topics || data);
        }
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.topicName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch; // You can add category filter later if needed
  });

  if (loading) {
      return <div className="py-24 text-center text-xl">Loading interview topics...</div>;
  }
 return (
      <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      {/* Header */}
        <div className="animate-fade-up mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl mb-4">
          Interview Topics
        </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          Choose a topic and start your practice interview
        </p>
      </div>

        <Separator className="mb-12 opacity-70" />

      {/* Search */}
        <div className="animate-fade-up mb-12 mx-auto max-w-xl" style={{ animationDelay: "100ms" }}>
          <div className="glass-panel relative rounded-2xl p-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
              className="h-12 border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-2xl text-muted-foreground">No topics found.</p>
          <Button 
            variant="outline" 
            className="mt-6 rounded-xl"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic, index) => (
            <Card key={topic._id} className="glass-panel animate-fade-up h-full flex flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ animationDelay: `${index * 70}ms` }}>
              <CardHeader className="p-0">
                <div className="aspect-video relative">
                  {topic.image ? (
                    <img
                      src={topic.image}
                      alt={topic.topicName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-500 to-emerald-500">
                      <span className="text-white text-4xl">🎯</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-6">
                <CardTitle className="mb-3 line-clamp-2 text-xl">
                  {topic.topicName}
                </CardTitle>
                <CardDescription className="line-clamp-4 text-base leading-relaxed">
                  {topic.description}
                </CardDescription>
              </CardContent>

              <CardFooter className="flex items-center justify-between px-6 pb-6 pt-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(topic.date || topic.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <Button asChild className="rounded-xl bg-gradient-to-r from-sky-500 to-emerald-500 text-white">
                  <Link href={`/interview/setup?topic=${encodeURIComponent(topic.topicName)}&source=admin`}>
                    Start Interview →
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}