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
    <div className="container mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
      <section className="relative mb-20 grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="animate-fade-up space-y-7">
          <Badge className="rounded-full border-0 bg-gradient-to-r from-sky-500 to-emerald-500 px-4 py-1.5 text-white shadow-md shadow-sky-500/25">
            Featured Insight
          </Badge>

          <h1 className="text-balance text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
            {featuredPost.title}
          </h1>

          <p className="max-w-xl text-lg text-muted-foreground md:text-xl">
            {featuredPost.excerpt}
          </p>
          <Button
            size="lg"
            className="animate-glow rounded-xl bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-7 text-white shadow-lg shadow-sky-600/20"
            asChild
          >
            <Link href="/learn">Start Learning</Link>
          </Button>
        </div>

        <div className="relative animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="absolute -right-4 -top-4 h-28 w-28 rounded-full bg-amber-400/25 blur-2xl" />
          <div className="absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-sky-500/25 blur-2xl" />
          <div className="glass-panel animate-floaty overflow-hidden rounded-3xl p-2 shadow-2xl shadow-slate-900/10">
            <img
              className="h-[420px] w-full rounded-[1.25rem] object-cover"
              src="https://media.istockphoto.com/id/1530973530/photo/software-development-concept.webp?a=1&b=1&s=612x612&w=0&k=20&c=NXxmootfVkI2C_JS5-5p06qMD_ngxJnH8BfLxnoQKP8="
              alt="Software developer workspace"
            />
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="animate-fade-up flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Free Interview Demo</h2>
            <p className="mt-2 text-muted-foreground">
              Pick a lane and jump into instant mock interviews.
            </p>
          </div>
          <Badge variant="outline" className="rounded-full px-4 py-1 text-xs tracking-wide">
            Hands-on Practice
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {recentPosts.map((post, index) => (
            <Card
              key={post.id}
              className="group glass-panel animate-fade-up overflow-hidden rounded-2xl border-border/60 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <CardHeader className="p-0">
                <div className="aspect-video overflow-hidden">
                  {post.src ? (
                    <img
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      src={post.src}
                      alt={post.title}
                    />
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 p-5">
                <Badge variant="outline" className="w-fit rounded-full">
                  {post.category}
                </Badge>
                <CardTitle className="line-clamp-2 text-lg transition-colors group-hover:text-primary">
                  {post.title}
                </CardTitle>
                <CardDescription>{post.date}</CardDescription>
              </CardContent>

              <CardFooter className="p-5 pt-0">
                <Button variant="ghost" className="w-full justify-between rounded-xl" asChild>
                  <Link href={`/interview/setup?topic=${encodeURIComponent(post.title)}&source=demo`}>
                    Try Demo <span>→</span>
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
