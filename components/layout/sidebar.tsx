"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquare, FileText, Shield, Users, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SessionList } from "@/components/chat/session-list";

import type { UserProfile } from "@/lib/types/user";

interface SidebarProps {
  user: UserProfile;
  onNavigate?: () => void;
}

const NAV_ITEMS = [
  { href: "/chat", label: "Συνομιλίες", icon: MessageSquare },
] as const;

const HR_ITEMS = [
  { href: "/admin/documents", label: "Διαχείριση Εγγράφων", icon: FileText },
  { href: "/admin/logs", label: "Αρχείο Ελέγχου", icon: Shield },
] as const;

const ADMIN_ITEMS = [
  { href: "/admin/users", label: "Διαχείριση Χρηστών", icon: Users },
] as const;

export function Sidebar({ user, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHr = user.role === "hr_manager" || user.role === "admin";
  const isAdmin = user.role === "admin";

  const handleNewChat = () => {
    onNavigate?.();
    window.dispatchEvent(new Event("new-chat"));
    router.push("/chat");
  };

  return (
    <div className="flex h-full flex-col">
      {/* New chat button */}
      <div className="p-4">
        <Button className="w-full gap-2" onClick={handleNewChat}>
          <Plus className="h-4 w-4" />
          Νέα Συνομιλία
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        {/* Main navigation */}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href || pathname.startsWith(`${item.href}/`)
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Session list */}
        <div className="mt-4">
          <p className="px-3 text-xs font-medium text-primary/70 uppercase tracking-wider mb-2">
            Πρόσφατες Συνομιλίες
          </p>
          <SessionList onNavigate={onNavigate} />
        </div>

        {/* HR section */}
        {isHr && (
          <>
            <Separator className="my-4" />
            <p className="px-3 text-xs font-medium text-primary/70 uppercase tracking-wider mb-2">
              Διαχείριση
            </p>
            <nav className="space-y-1">
              {HR_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    pathname.startsWith(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}

              {/* Admin-only items */}
              {isAdmin &&
                ADMIN_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      pathname.startsWith(item.href)
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground",
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
            </nav>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
