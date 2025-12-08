// components/header.tsx
"use client";
import Link from "next/link";
import { Menu,CircleUserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger,SheetTitle,SheetHeader } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle"; // ← New component
import { useAuth } from "@/app/Auth";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Articles", href: "/articles" },
  { name: "About", href: "/about" },
  { name: "Signup", href: "/signup" },
  // { name: "Login", href: "/login" },
  // {name:<CircleUserRound/>, href:"/profile" }
];


export function Header() {
  const { user,LogoutUser } = useAuth();

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
          {!user && (
            <Link href="/login" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Login</Link>
          )}
          {user && (
          <Link className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
             href="/" onClick={LogoutUser}>Logout</Link>
             )}
             <Link href="/account" className="hover:text-gray-500">
              <CircleUserRound/>
              </Link>
          <ThemeToggle /> {/* ← Clean, no hydration error */}
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
              <SheetTitle className="text-xl font-bold ml-35 ">Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col space-y-6 mt-8">
              {navItems.map((item) => (
                <Link key={item.name} href={item.href} className="text-lg font-medium">
                  {item.name}
                </Link>
              ))}
                <div className="pt-4">
                <ThemeToggle />
              </div>
              <Link href="/account" className="hover:text-gray-500"> 
             <CircleUserRound/>
             </Link>
            </div>
            
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}