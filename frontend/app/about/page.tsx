import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BrainCircuit,
  Code2,
  Cpu,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
  Target,
} from "lucide-react";
import Link from "next/link";

const teamMembers = [
  "Amisha Nishankar",
  "Kajal Warthi",
  "Anamika Ghosh",
  "Anshika Borkar",
  "Chaitali Matte",
  "Amey Sawaikar",
  "Atharva Gaddalwar",
  "Ayush Kulmate",
];

const pillars = [
  {
    icon: BrainCircuit,
    title: "AI-driven practice",
    description:
      "Real interview simulations that adapt to the topic, difficulty, and candidate response style.",
  },
  {
    icon: ShieldCheck,
    title: "Confidence building",
    description:
      "A guided environment that helps users improve communication, structure, and accuracy under pressure.",
  },
  {
    icon: Rocket,
    title: "Future-ready growth",
    description:
      "A project roadmap that pushes beyond the mini project into a stronger final-year system.",
  },
];

const roadmap = [
  {
    step: "Version 1.0",
    text: "A working AI-powered virtual interview platform with interactive question flow and evaluation.",
  },
  {
    step: "Final Year Vision",
    text: "Rebuild the intelligence layer in Python and make the experience smarter, faster, and more interactive.",
  },
  {
    step: "Next Evolution",
    text: "Add deeper feedback, improved analytics, and richer personalization to mentor users more effectively.",
  },
];

export default function AboutPage() {
  return (
    <main className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-24 left-[-6rem] h-72 w-72 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute right-[-4rem] top-32 h-80 w-80 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
      </div>

      <section className="relative container mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-cyan-100 backdrop-blur">
          <Sparkles className="h-4 w-4" />
          Tech Nova | AI Powered Virtual Interview
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div className="space-y-8">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.28em] text-cyan-200/80">
                About Us
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Welcome to Tech Nova, where innovation meets ambition.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
                We are a team of passionate B.Tech Computer Science Engineering students from KDK College of Engineering, Nagpur, currently in our 3rd Year (6th Semester). This project, titled “AI Powered Virtual Interview”, is our mini project, built with the vision of transforming how interviews are practiced and experienced.
              </p>
            </div>

            <Card className="border-white/10 bg-white/5 p-6 text-slate-100 shadow-2xl backdrop-blur-xl md:p-8">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Target className="h-5 w-5 text-cyan-300" />
                Our Mission
              </h2>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Our platform aims to simulate real interview scenarios using artificial intelligence, helping users improve their confidence, communication skills, and technical performance — all from the comfort of their screen.
              </p>
              <p className="mt-4 text-base leading-8 text-slate-300">
                But this is just the beginning. We are not stopping here. Our goal is to take this project to the next level by evolving it into our Final Year Project, where we plan to enhance and rebuild the entire AI system using Python, making it smarter, faster, and more interactive.
              </p>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              {pillars.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="border-white/10 bg-white/5 p-5 backdrop-blur-xl">
                  <Icon className="h-6 w-6 text-cyan-300" />
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
                </Card>
              ))}
            </div>

            <Card className="border-white/10 bg-gradient-to-br from-cyan-500/10 via-white/5 to-emerald-500/10 p-6 backdrop-blur-xl md:p-8">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Lightbulb className="h-5 w-5 text-amber-300" />
                Our Vision
              </h2>
              <blockquote className="mt-4 border-l-2 border-cyan-300/70 pl-4 text-lg italic text-slate-100">
                “Practice doesn’t just make perfect — smart practice powered by AI makes you unstoppable.”
              </blockquote>
              <p className="mt-4 text-base leading-8 text-slate-300">
                Our mission is to create a system that not only evaluates but also guides, mentors, and empowers users to crack interviews with confidence.
              </p>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <Card className="border-white/10 bg-black/30 p-6 backdrop-blur-xl md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/80">Our Team</p>
                  <h2 className="text-2xl font-bold">Tech Nova</h2>
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-300">
                Behind this project is a dedicated team of innovators working together to build practical, future-facing software for interview preparation.
              </p>

              <div className="mt-5 space-y-2">
                {teamMembers.map((member) => (
                  <div
                    key={member}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100"
                  >
                    <Users className="h-4 w-4 text-cyan-300" />
                    {member}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <Code2 className="h-5 w-5 text-emerald-300" />
                Our Mentor
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                We are grateful for the guidance and support of our mentor: Prof. Ravi Thakur Sir. His constant encouragement and valuable insights have been instrumental in shaping this project.
              </p>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
              <h3 className="flex items-center gap-2 text-xl font-bold">
                <ArrowRight className="h-5 w-5 text-amber-300" />
                Project Journey
              </h3>
              <div className="mt-4 space-y-4">
                {roadmap.map((item, index) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-bold text-cyan-200">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-50">{item.step}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-300">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </aside>
        </div>

        <Separator className="my-10 bg-white/10" />

        <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
          <h2 className="text-2xl font-bold">A Little Something From Us</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <p className="leading-8 text-slate-300">
              We don’t just build projects… We build experiences.
            </p>
            <p className="leading-8 text-slate-300">
              We don’t just write code… We write possibilities.
            </p>
          </div>
          <p className="mt-4 leading-8 text-slate-300">
            And this is just Version 1.0 — the real innovation is yet to come.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-cyan-100">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Version 1.0
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              Built at KDK College of Engineering
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              AI Powered Virtual Interview
            </span>
          </div>
        </Card>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/interview/setup"
            className="inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Try the Interview
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
