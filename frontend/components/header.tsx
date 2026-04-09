// components/header.tsx
"use client";
import Link from "next/link";
import { Menu, CircleUserRound, Shield } from "lucide-react"; // ← Added Shield icon for Admin
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/app/Auth";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/articles" },
  { name: "About", href: "/about" },
  { name: "Signup", href: "/signup" },
];

export function Header() {
const { user, LogoutUser, isAdmin } = useAuth();
  

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold tracking-tight">NovaTech</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}

          {/* Admin Panel - Only visible to admins */}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Shield className="h-4 w-4" />
              Admin Panel
            </Link>
          )}

          {!user ? (
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Login
            </Link>
          ) : (
            <Link
              href="/"
              onClick={LogoutUser}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Logout
            </Link>
          )}

          {user && (
            <Link href="/account" className="hover:text-foreground transition-colors">
              <CircleUserRound className="h-5 w-5" />
            </Link>
          )}

          <ThemeToggle />
        </nav>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
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
                  className="text-lg font-medium"
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
              ) : (
                <Link href="/" onClick={LogoutUser} className="text-lg font-medium">
                  Logout
                </Link>
              )}

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