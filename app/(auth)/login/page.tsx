"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [supabase] = useState(() => createClient());

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSignUpSuccess(false);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Λάθος email ή κωδικός. Δοκιμάστε ξανά.");
      setIsLoading(false);
      return;
    }

    router.push("/chat");
    router.refresh();
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      setError("Συμπληρώστε email και κωδικό.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSignUpSuccess(false);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (signUpError) {
      setError("Η εγγραφή απέτυχε. Δοκιμάστε ξανά.");
      setIsLoading(false);
      return;
    }

    setSignUpSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20 px-4">
      <Card className="w-full max-w-md shadow-lg shadow-primary/5">
        <CardHeader className="text-center pb-2">
          {/* Branded logo */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold shadow-md">
            HR
          </div>
          <CardTitle className="text-2xl font-bold">HR AI Assistant</CardTitle>
          <CardDescription>
            Συνδεθείτε με τον εταιρικό σας λογαριασμό
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signUpSuccess && (
            <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
              Ελέγξτε το email σας για επιβεβαίωση!
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.gr"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Κωδικός</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                minLength={6}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Σύνδεση..." : "Σύνδεση"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm"
              onClick={handleSignUp}
              disabled={isLoading}
            >
              Δημιουργία λογαριασμού
            </Button>
          </form>

          {/* OAuth divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">
              ή συνδεθείτε με
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* OAuth placeholder buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-sm"
              disabled
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                className="shrink-0"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-sm"
              disabled
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 23 23"
                className="shrink-0"
              >
                <path fill="#f25022" d="M1 1h10v10H1z" />
                <path fill="#00a4ef" d="M1 12h10v10H1z" />
                <path fill="#7fba00" d="M12 1h10v10H12z" />
                <path fill="#ffb900" d="M12 12h10v10H12z" />
              </svg>
              Microsoft
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            Σύντομα διαθέσιμο
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
