"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DocumentUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (doc: Record<string, unknown>) => void;
}

const CATEGORIES = [
  { value: "policy", label: "Πολιτική" },
  { value: "regulation", label: "Κανονισμός" },
  { value: "onboarding", label: "Onboarding" },
  { value: "faq", label: "FAQ" },
  { value: "template", label: "Πρότυπο" },
  { value: "job_description", label: "Περιγραφή θέσης" },
  { value: "benefits", label: "Παροχές" },
  { value: "evaluation", label: "Αξιολόγηση" },
  { value: "disciplinary", label: "Πειθαρχικό" },
  { value: "payroll", label: "Μισθοδοσία" },
];

export function DocumentUploader({
  isOpen,
  onClose,
  onUploaded,
}: DocumentUploaderProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("policy");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title.trim()) return;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      formData.append("category", category);

      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? "Αποτυχία μεταφόρτωσης");
      }

      const { data } = await res.json();
      onUploaded(data);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Αποτυχία μεταφόρτωσης");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("policy");
    setFile(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Μεταφόρτωση Εγγράφου</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Τίτλος</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Τίτλος εγγράφου"
              required
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Κατηγορία</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Αρχείο</label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setFile(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              PDF, DOCX, TXT (max 10MB)
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Ακύρωση
            </Button>
            <Button
              type="submit"
              disabled={isUploading || !file || !title.trim()}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Μεταφόρτωση..." : "Μεταφόρτωση"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
