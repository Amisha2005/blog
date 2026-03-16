// app/about/page.tsx
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Mail, Twitter, Github, Linkedin, Globe } from "lucide-react";
import Link from "next/link";

const author = {
  name: "Amisha Nishankar",
  role: "Full-Stack Developer & Writer",
  bio: "I build performant web applications and write about modern JavaScript, React, Next.js, and the future of the web. Currently engineering at a startup pushing the boundaries of edge computing.",
  avatar: "/avatar.jpg",
  location: "San Francisco, CA",
  joined: "2023",
};

const socialLinks = [
  { icon: Mail, href: "mailto:sarah@insightflow.dev", label: "Email" },
  { icon: Twitter, href: "https://twitter.com/sarahchen", label: "Twitter" },
  { icon: Github, href: "https://github.com/sarahchen", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/in/sarahchen", label: "LinkedIn" },
  { icon: Globe, href: "https://sarahchen.dev", label: "Website" },
];

const skills = [
  "React & Next.js",
  "TypeScript",
  "Tailwind CSS",
  "Node.js",
  "PostgreSQL",
  "GraphQL",
  "Vercel & Cloudflare",
  "Performance Optimization",
];

export default function AboutPage() {
  return (
    <div className="container max-w-5xl px-4 py-16 md:py-24 mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          About NovaTech
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A place where complex ideas in web development become clear. I share what I learn while building real-world applications — no fluff, just practical insights.
        </p>
      </div>

      <Separator className="mb-16" />

      {/* Author Card */}
      <div className="grid md:grid-cols-3 gap-12 items-start">
        <div className="md:col-span-1 flex flex-col items-center md:items-start">
          <Avatar className="h-48 w-48 ring-4 ring-background shadow-2xl">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="text-4xl">{author.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
          </Avatar>

          <div className="mt-8 text-center md:text-left space-y-4 w-full">
            <div>
              <h2 className="text-2xl font-bold">{author.name}</h2>
              <p className="text-muted-foreground">{author.role}</p>
            </div>

            <div className="flex justify-center md:justify-start gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <Button key={label} variant="outline" size="icon" asChild>
                  <Link href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
                    <Icon className="h-4 w-4" />
                  </Link>
                </Button>
              ))}
            </div>

            <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t">
              <p>📍 {author.location}</p>
              <p>✨ Writing here since {author.joined}</p>
            </div>
          </div>
        </div>

        {/* Bio & Details */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h3 className="text-2xl font-semibold mb-4">Hey, I'm Sarah 👋</h3>
            <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground space-y-4">
              <p>{author.bio}</p>
              <p>
                When I'm not coding or writing, you can find me exploring new coffee shops, contributing to open source, or speaking at local tech meetups.
              </p>
              <p>
                This blog is built with <strong>Next.js App Router</strong>, <strong>shadcn/ui</strong>, and deployed on Vercel — because I practice what I preach.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">What I Use Daily</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {skills.map((skill) => (
                <Card key={skill} className="p-4 text-center hover:shadow-md transition-shadow">
                  <p className="text-sm font-medium">{skill}</p>
                </Card>
              ))}
            </div>
          </div>

          <div className="pt-8">
            <h3 className="text-2xl font-semibold mb-4">Let's Connect</h3>
            <p className="text-muted-foreground mb-6">
              Have a question or just want to say hi? I'm always open to discussing web development, collaboration opportunities, or just sharing a good resource.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="mailto:sarah@insightflow.dev">
                  <Mail className="mr-2 h-5 w-5" />
                  Send Email
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/articles">
                  Read Latest Articles →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
