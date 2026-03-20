"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Json } from "@/lib/types/database";

interface AuditLogRow {
  id: string;
  user_email: string;
  action: string;
  details: Json | null;
  created_at: string;
}

interface AuditLogTableProps {
  initialLogs: AuditLogRow[];
}

const ACTION_LABELS: Record<string, string> = {
  chat: "Συνομιλία",
  document_upload: "Μεταφόρτωση",
  document_delete: "Διαγραφή",
  document_update: "Ενημέρωση",
  login: "Σύνδεση",
  logout: "Αποσύνδεση",
  role_change: "Αλλαγή ρόλου",
};

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  chat: "default",
  document_upload: "secondary",
  document_delete: "destructive",
  document_update: "secondary",
  login: "default",
  logout: "default",
  role_change: "destructive",
};

export function AuditLogTable({ initialLogs }: AuditLogTableProps) {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? initialLogs.filter(
        (log) =>
          log.user_email.toLowerCase().includes(filter.toLowerCase()) ||
          log.action.toLowerCase().includes(filter.toLowerCase()),
      )
    : initialLogs;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Αναζήτηση κατά email ή ενέργεια..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-sm"
      />

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Χρήστης</TableHead>
              <TableHead>Ενέργεια</TableHead>
              <TableHead className="hidden md:table-cell">
                Λεπτομέρειες
              </TableHead>
              <TableHead>Ημερομηνία</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  Δεν βρέθηκαν εγγραφές
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm">{log.user_email}</TableCell>
                  <TableCell>
                    <Badge variant={ACTION_COLORS[log.action] ?? "default"}>
                      {ACTION_LABELS[log.action] ?? log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground max-w-xs truncate">
                    {log.details
                      ? JSON.stringify(log.details).slice(0, 80)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(log.created_at).toLocaleString("el-GR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
