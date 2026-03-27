"use client";

import { useState } from "react";
import { ExternalLink, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DocumentUploader } from "@/components/admin/document-uploader";

interface DocumentRow {
  id: string;
  title: string;
  category: string;
  access_level: string;
  file_name: string | null;
  version: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

interface DocumentListProps {
  initialDocuments: DocumentRow[];
}

const CATEGORY_LABELS: Record<string, string> = {
  policy: "Πολιτική",
  regulation: "Κανονισμός",
  onboarding: "Onboarding",
  faq: "FAQ",
  template: "Πρότυπο",
  job_description: "Θέση",
  benefits: "Παροχές",
  evaluation: "Αξιολόγηση",
  disciplinary: "Πειθαρχικό",
  payroll: "Μισθοδοσία",
};

export function DocumentList({ initialDocuments }: DocumentListProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);

    try {
      const res = await fetch(`/api/documents/${confirmDeleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== confirmDeleteId));
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploaded = (doc: Record<string, unknown>) => {
    setDocuments((prev) => [doc as DocumentRow, ...prev]);
    setIsUploaderOpen(false);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setIsUploaderOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Μεταφόρτωση
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Τίτλος</TableHead>
              <TableHead>Κατηγορία</TableHead>
              <TableHead>Πρόσβαση</TableHead>
              <TableHead>Έκδοση</TableHead>
              <TableHead className="hidden sm:table-cell">Ημερομηνία</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Δεν υπάρχουν έγγραφα
                </TableCell>
              </TableRow>
            ) : (
              documents.map((doc) => (
                <TableRow
                  key={doc.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() =>
                    window.open(`/api/documents/${doc.id}/download`, "_blank")
                  }
                >
                  <TableCell className="font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {doc.title}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {CATEGORY_LABELS[doc.category] ?? doc.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        doc.access_level === "hr_only"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {doc.access_level === "hr_only" ? "HR" : "Όλοι"}
                    </Badge>
                  </TableCell>
                  <TableCell>v{doc.version}</TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {new Date(doc.created_at).toLocaleDateString("el-GR")}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(doc.id);
                      }}
                      disabled={deletingId === doc.id}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DocumentUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUploaded={handleUploaded}
      />

      <Dialog
        open={!!confirmDeleteId}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Διαγραφή Εγγράφου</DialogTitle>
            <DialogDescription>
              Θέλετε σίγουρα να διαγράψετε αυτό το έγγραφο; Η ενέργεια δεν
              μπορεί να αναιρεθεί.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Ακύρωση
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Διαγραφή
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
