"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">Κάτι πήγε στραβά</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message ||
          "Παρουσιάστηκε σφάλμα στη συνομιλία. Παρακαλώ δοκιμάστε ξανά."}
      </p>
      <div className="flex gap-2">
        <Button onClick={reset}>Δοκιμάστε ξανά</Button>
        <Link href="/chat">
          <Button variant="outline">Νέα Συνομιλία</Button>
        </Link>
      </div>
    </div>
  );
}
