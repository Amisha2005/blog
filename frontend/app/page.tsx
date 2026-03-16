// app/page.tsx
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const featuredPost = {
  title: "Meet Nova — Your AI Technical Interviewer",
  excerpt:
    "Exploring React Server Components, AI-assisted coding, and the edge runtime revolution.",
  author: "Amisha Nishankar",
  avatar: "/avatar.jpg",
  date: "December 4, 2025",

  category: "Future",
};

const recentPosts = [
  {
    id: 1,
    src: "https://tse3.mm.bing.net/th/id/OIP.oR7K377pdzitXWkOEdSIEQHaEK?pid=Api&P=0&h=180",
    title: "Mastering HTML in 2025",
    category: "TypeScript",
    date: "Dec 2",
   
  },
  {
    id: 2,
    src: "https://tse3.mm.bing.net/th/id/OIP.SBg2sgLVDVZoNR6fLO2ZKAHaFI?pid=Api&P=0&h=180",
    title: "Mastering PYTHON in 2025",
    category: "A11y",
    date: "Nov 30",
  
  },
  {
    id: 3,
    src: "https://tse4.mm.bing.net/th/id/OIP.dkhkj1S3HeuN_Q991Kpb4wHaE7?pid=Api&P=0&h=180",
    title: "Tailwind Css",
    category: "Design",
    date: "Nov 28",
    
  },
  {
    id: 4,
    src: "https://tse1.mm.bing.net/th/id/OIP.WaCOgSUgMm-RNN1PhMBPWgHaEK?pid=Api&P=0&h=180",
    title: "customize your interview",
    category: "choose topic according to you",
    date: "Nov 25",
    
  },
];

export default function Home() {
  return (
    <div className="container px-4 py-12 max-w-6xl mx-auto">
      {/* Hero / Featured Post */}
      <section className="grid lg:grid-cols-2 gap-12 items-center mb-20">
        <div className="space-y-6">
          <Badge variant="secondary">Featured Article</Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            {featuredPost.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {featuredPost.excerpt}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Avatar className="h-10 w-10">
              <AvatarImage src={featuredPost.avatar} />
              <AvatarFallback>AN</AvatarFallback>
            </Avatar>
            <span>{featuredPost.author}</span>
          </div>
          <Button size="lg" asChild>
            <Link href="/learn">Learn →</Link>
          </Button>
        </div>
        <div className="bg-muted rounded-2xl aspect-video lg:aspect-auto lg:h-96 border">
          <img
            className="rounded-2xl"
            style={{ width: "40vw", height: "72vh" }}
            src="https://media.istockphoto.com/id/1530973530/photo/software-development-concept.webp?a=1&b=1&s=612x612&w=0&k=20&c=NXxmootfVkI2C_JS5-5p06qMD_ngxJnH8BfLxnoQKP8="
          />
        </div>
      </section>

      {/* Recent Posts Grid */}
      <section>
        <h2 className="text-3xl font-bold mb-8">Free Interview Demo</h2>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {recentPosts.map((post) => (
            <Card
              key={post.id}
              className="group hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="bg-muted border-2 border-dashed rounded-xl aspect-video mb-4">
                  {post.src ? (
                    <img
                      className="rounded-xl"
                      style={{ width: "100%", height: "100%" }}
                      src={post.src}
                    />
                  ) : null}
                </div>
                <Badge variant="outline" className="w-fit">
                  {post.category}
                </Badge>
                <CardTitle className="line-clamp-2 mt-2 group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription>
                  {post.date}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/interview">Try →</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
