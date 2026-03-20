"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";

import type { UserProfile } from "@/lib/types/user";

interface MobileNavProps {
  user: UserProfile;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-muted">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Μενού πλοήγησης</span>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Πλοήγηση</SheetTitle>
        <Sidebar user={user} onNavigate={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
