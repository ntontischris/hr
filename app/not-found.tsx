import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="text-lg font-semibold">Η σελίδα δεν βρέθηκε</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Η σελίδα που ψάχνετε δεν υπάρχει ή έχει μετακινηθεί.
      </p>
      <Link href="/chat">
        <Button>Επιστροφή στη Συνομιλία</Button>
      </Link>
    </div>
  );
}
