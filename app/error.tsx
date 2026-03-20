"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-lg font-semibold">Κάτι πήγε στραβά</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Παρουσιάστηκε ένα απρόσμενο σφάλμα. Παρακαλώ δοκιμάστε ξανά.
      </p>
      <Button onClick={reset}>Δοκιμάστε ξανά</Button>
    </div>
  );
}
