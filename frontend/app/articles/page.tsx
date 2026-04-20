// app/articles/page.tsx
"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

const topicImageContainerClass =
  "relative aspect-[16/9] overflow-hidden rounded-t-2xl bg-gradient-to-br from-sky-500/20 via-slate-900 to-emerald-500/20";

export default function ArticlesPage() {
  const [topics, setTopics] = useState<InterviewTopic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

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
            <Card key={topic._id} className="glass-panel group animate-fade-up flex h-full flex-col overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ animationDelay: `${index * 70}ms` }}>
              <CardHeader className="p-0">
                <div className={topicImageContainerClass}>
                  {topic.image ? (
                    <>
                      <img
                        src={topic.image}
                        alt={topic.topicName}
                        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </>
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
