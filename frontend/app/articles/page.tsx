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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

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
    return <div className="text-center py-20 text-xl">Loading interview topics...</div>;
  }
 return (
    <div className="container max-w-6xl px-4 py-12 md:py-16 mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Interview Topics
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose a topic and start your practice interview
        </p>
      </div>

      <Separator className="mb-12" />

      {/* Search */}
      <div className="mb-12 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Topics Grid */}
      {filteredTopics.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-muted-foreground">No topics found.</p>
          <Button 
            variant="outline" 
            className="mt-6"
            onClick={() => setSearchQuery("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredTopics.map((topic) => (
            <Card key={topic._id} className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="p-0">
                <div className="aspect-video relative">
                  {topic.image ? (
                    <img
                      src={topic.image}
                      alt={topic.topicName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-4xl">🎯</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1 p-6">
                <CardTitle className="line-clamp-2 text-xl mb-3">
                  {topic.topicName}
                </CardTitle>
                <CardDescription className="line-clamp-4 text-base">
                  {topic.description}
                </CardDescription>
              </CardContent>

              <CardFooter className="px-6 pb-6 pt-0 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {new Date(topic.date || topic.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>

                <Button asChild>
                  <Link href={`/interview?topic=${encodeURIComponent(topic.topicName)}`}>
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