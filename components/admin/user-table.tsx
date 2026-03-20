"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

interface UserTableProps {
  initialUsers: UserRow[];
}

const ROLE_OPTIONS = [
  { value: "employee", label: "Υπάλληλος" },
  { value: "hr_manager", label: "HR Manager" },
  { value: "admin", label: "Διαχειριστής" },
];

const ROLE_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
  employee: "default",
  hr_manager: "secondary",
  admin: "destructive",
};

export function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingId(userId);

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Χρήστης</TableHead>
            <TableHead className="hidden sm:table-cell">Τμήμα</TableHead>
            <TableHead>Ρόλος</TableHead>
            <TableHead>Κατάσταση</TableHead>
            <TableHead className="hidden md:table-cell">Εγγραφή</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                Δεν βρέθηκαν χρήστες
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">
                      {user.full_name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">
                  {user.department ?? "—"}
                </TableCell>
                <TableCell>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updatingId === user.id}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Ενεργός" : "Ανενεργός"}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  {new Date(user.created_at).toLocaleDateString("el-GR")}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
