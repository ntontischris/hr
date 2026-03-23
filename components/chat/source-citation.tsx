"use client";

import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Source {
  id: string;
  title: string;
  category: string;
}

interface SourceCitationProps {
  sources: Source[];
}

const CATEGORY_LABELS: Record<string, string> = {
  policy: "Πολιτική",
  regulation: "Κανονισμός",
  onboarding: "Onboarding",
  faq: "FAQ",
  template: "Πρότυπο",
  job_description: "Περιγραφή θέσης",
  benefits: "Παροχές",
  evaluation: "Αξιολόγηση",
  disciplinary: "Πειθαρχικό",
  payroll: "Μισθοδοσία",
};

export function SourceCitation({ sources }: SourceCitationProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="rounded-lg border border-primary/10 bg-primary/5 text-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-primary hover:text-primary/80 transition-colors"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span className="font-medium">Πηγές ({sources.length})</span>
        {isOpen ? (
          <ChevronDown className="ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="ml-auto h-3.5 w-3.5" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all",
          isOpen ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="space-y-2 border-t px-3 py-2">
          {sources.map((source) => (
            <div key={source.id} className="flex items-center gap-2">
              <span className="text-xs">{source.title}</span>
              <Badge variant="secondary" className="text-xs shrink-0">
                {CATEGORY_LABELS[source.category] ?? source.category}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
