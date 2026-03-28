"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { SetPasswordSchema } from "@/lib/validators/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supabase] = useState(() => createClient());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = SetPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (updateError) {
      setError(
        updateError.message === "Auth session missing!"
          ? "Ο σύνδεσμος έχει λήξει. Δοκιμάστε ξανά από τη σελίδα σύνδεσης."
          : "Αποτυχία ορισμού κωδικού. Δοκιμάστε ξανά.",
      );
      setIsLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20 px-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border bg-card p-8 shadow-lg">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Ορίστε τον κωδικό σας</h1>
          <p className="text-sm text-muted-foreground">
            Επιλέξτε έναν κωδικό για τον λογαριασμό σας
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Νέος κωδικός
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Τουλάχιστον 6 χαρακτήρες"
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Επιβεβαίωση κωδικού
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Επαναλάβετε τον κωδικό"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Αποθήκευση..." : "Ορισμός κωδικού"}
          </Button>
        </form>
      </div>
    </div>
  );
}
