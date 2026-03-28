"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageSquareText, Shield, FileText } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const ERROR_MESSAGES: Record<string, string> = {
  expired_link: "Ο σύνδεσμος έχει λήξει. Ζητήστε νέο σύνδεσμο.",
  invalid_link: "Μη έγκυρος σύνδεσμος. Δοκιμάστε ξανά.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    urlError ? (ERROR_MESSAGES[urlError] ?? null) : null,
  );
  const [supabase] = useState(() => createClient());

  // Forgot password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Λάθος email ή κωδικός. Δοκιμάστε ξανά.");
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.push("/chat");
    router.refresh();
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError("Συμπληρώστε το email σας.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      {
        redirectTo: `${window.location.origin}/callback?next=/set-password`,
      },
    );

    if (resetError) {
      setError("Αποτυχία αποστολής. Δοκιμάστε ξανά.");
      setIsLoading(false);
      return;
    }

    setResetSent(true);
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-primary/5 via-primary/10 to-primary/20">
      {/* Hero section */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* Logo */}
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-primary text-primary-foreground text-3xl font-bold shadow-lg shadow-primary/20">
            HR
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              HR AI Assistant
            </h1>
            <p className="mx-auto max-w-lg text-lg text-muted-foreground">
              Ο ψηφιακός σας βοηθός για θέματα ανθρώπινου δυναμικού. Απαντήσεις
              σε πολιτικές, παροχές και διαδικασίες — άμεσα.
            </p>
          </div>

          {/* Features */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card/50 px-6 py-5 backdrop-blur-sm">
              <MessageSquareText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Άμεσες Απαντήσεις</span>
              <span className="text-xs text-muted-foreground">
                AI chat για HR ερωτήσεις
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card/50 px-6 py-5 backdrop-blur-sm">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Τεκμηριωμένα</span>
              <span className="text-xs text-muted-foreground">
                Βασισμένα σε εταιρικά έγγραφα
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border bg-card/50 px-6 py-5 backdrop-blur-sm">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium">Ασφαλές</span>
              <span className="text-xs text-muted-foreground">
                Εταιρική πρόσβαση μόνο
              </span>
            </div>
          </div>

          {/* Login button → opens dialog */}
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  size="lg"
                  className="mt-6 px-8 text-base shadow-md shadow-primary/20"
                />
              }
            >
              Σύνδεση
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-center">
                  {isForgotPassword ? "Επαναφορά κωδικού" : "Σύνδεση"}
                </DialogTitle>
                <DialogDescription className="text-center">
                  {isForgotPassword
                    ? "Εισάγετε το email σας για να λάβετε σύνδεσμο επαναφοράς"
                    : "Συνδεθείτε με τον εταιρικό σας λογαριασμό"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {resetSent && (
                  <div className="rounded-lg bg-primary/10 px-4 py-3 text-sm text-primary">
                    Ελέγξτε το email σας για τον σύνδεσμο επαναφοράς!
                  </div>
                )}

                {isForgotPassword ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="resetEmail"
                        className="text-sm font-medium"
                      >
                        Email
                      </label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@company.gr"
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                      className="w-full"
                      onClick={handleResetPassword}
                      disabled={isLoading || resetSent}
                    >
                      {isLoading ? "Αποστολή..." : "Αποστολή συνδέσμου"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError(null);
                        setResetSent(false);
                      }}
                    >
                      Επιστροφή στη σύνδεση
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.gr"
                        required
                        autoComplete="email"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Κωδικός
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        minLength={6}
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Σύνδεση..." : "Σύνδεση"}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError(null);
                      }}
                    >
                      Ξέχασα τον κωδικό μου
                    </Button>
                  </form>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} HR AI Assistant — Εσωτερική Χρήση
      </footer>
    </div>
  );
}
