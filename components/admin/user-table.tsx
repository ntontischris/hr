"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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

  const handleUserAdded = (newUser: UserRow) => {
    setUsers((prev) => [newUser, ...prev]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {users.length} χρήστ{users.length === 1 ? "ης" : "ες"}
        </p>
        <InviteUserDialog onUserAdded={handleUserAdded} />
      </div>

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
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value)
                      }
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
    </div>
  );
}

interface InviteUserDialogProps {
  onUserAdded: (user: UserRow) => void;
}

function InviteUserDialog({ onUserAdded }: InviteUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("employee");
  const [department, setDepartment] = useState("");

  const resetForm = () => {
    setEmail("");
    setFullName("");
    setRole("employee");
    setDepartment("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fullName,
          role,
          department: department || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error?.message ?? "Αποτυχία πρόσκλησης χρήστη");
        return;
      }

      // Add to list optimistically
      onUserAdded({
        id: crypto.randomUUID(),
        email,
        full_name: fullName,
        role,
        department: department || null,
        is_active: true,
        created_at: new Date().toISOString(),
      });

      resetForm();
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetForm();
      }}
    >
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <UserPlus className="h-4 w-4" />
        Προσθήκη Χρήστη
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Πρόσκληση Χρήστη</DialogTitle>
          <DialogDescription>
            Ο χρήστης θα λάβει email πρόσκλησης για να ορίσει κωδικό.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="invite-name" className="text-sm font-medium">
              Ονοματεπώνυμο
            </label>
            <Input
              id="invite-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Γιάννης Παπαδόπουλος"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="invite-email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.gr"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="invite-role" className="text-sm font-medium">
                Ρόλος
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="invite-dept" className="text-sm font-medium">
                Τμήμα
              </label>
              <Input
                id="invite-dept"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="π.χ. Λογιστήριο"
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Ακύρωση
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Αποστολή..." : "Πρόσκληση"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
