// components/header.tsx
"use client";
import Link from "next/link";
import { Menu, CircleUserRound, Shield } from "lucide-react"; // ← Added Shield icon for Admin
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/app/Auth";

const baseNavItems = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/articles" },
  { name: "About", href: "/about" },
];

export function Header() {
const { user, isAdmin } = useAuth();
  const navItems = user
    ? baseNavItems
    : [...baseNavItems, { name: "Signup", href: "/signup" }];
  

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-18 items-center justify-between px-4 md:px-6">
        <Link href="/" className="group flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition-transform group-hover:scale-105">
            N
          </span>
          <span className="text-lg font-semibold tracking-tight md:text-xl">NovaTech</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-right after:scale-x-0 after:bg-gradient-to-r after:from-sky-500 after:to-emerald-500 after:transition-transform after:duration-300 hover:after:origin-left hover:after:scale-x-100"
            >
              {item.name}
            </Link>
          ))}

          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-sm font-semibold text-muted-foreground transition hover:border-sky-500/50 hover:text-foreground"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          {!user ? (
            <Link
              href="/login"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
            >
              Login
            </Link>
          ) : null}

          {user && (
            <Link href="/account" className="rounded-full border border-border/70 p-1.5 transition hover:border-sky-500/50 hover:text-foreground">
              <CircleUserRound className="h-5 w-5" />
            </Link>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="rounded-full border border-border/70">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
            </SheetHeader>

            <div className="flex flex-col space-y-6 mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-lg font-semibold"
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Panel in Mobile Menu */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-lg font-medium"
                >
                  <Shield className="h-5 w-5" />
                  Admin Panel
                </Link>
              )}

              {!user ? (
                <Link href="/login" className="text-lg font-medium">
                  Login
                </Link>
              ) : null}

              {user && (
                <Link href="/account" className="flex items-center gap-2 text-lg font-medium">
                  <CircleUserRound className="h-5 w-5" />
                  Account
                </Link>
              )}

              <div className="pt-4">
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}