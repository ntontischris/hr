"use client";

import { useState } from "react";
import {
  MessageSquare,
  Activity,
  ChevronDown,
  ChevronRight,
  Search,
  User,
  Bot,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  title: string | null;
  userEmail: string;
  userFullName: string | null;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

interface AuditLog {
  id: string;
  user_email: string;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface LogsViewProps {
  chatSessions: ChatSession[];
  auditLogs: AuditLog[];
}

const ACTION_LABELS: Record<string, string> = {
  document_upload: "Μεταφόρτωση εγγράφου",
  document_delete: "Διαγραφή εγγράφου",
  document_update: "Ενημέρωση εγγράφου",
  user_invite: "Πρόσκληση χρήστη",
  user_update: "Ενημέρωση χρήστη",
  role_change: "Αλλαγή ρόλου",
  login: "Σύνδεση",
  logout: "Αποσύνδεση",
};

type TabType = "conversations" | "actions";

export function LogsView({ chatSessions, auditLogs }: LogsViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("conversations");
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => {
            setActiveTab("conversations");
            setSearch("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "conversations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Συνομιλίες ({chatSessions.length})
        </button>
        <button
          onClick={() => {
            setActiveTab("actions");
            setSearch("");
          }}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "actions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Activity className="h-4 w-4" />
          Ενέργειες ({auditLogs.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            activeTab === "conversations"
              ? "Αναζήτηση με email ή ερώτηση..."
              : "Αναζήτηση με email ή ενέργεια..."
          }
          className="pl-9"
        />
      </div>

      {activeTab === "conversations" ? (
        <ConversationList sessions={chatSessions} search={search} />
      ) : (
        <ActionList logs={auditLogs} search={search} />
      )}
    </div>
  );
}

/* ─── Conversations Tab ─── */

function ConversationList({
  sessions,
  search,
}: {
  sessions: ChatSession[];
  search: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = search
    ? sessions.filter(
        (s) =>
          s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
          s.userFullName?.toLowerCase().includes(search.toLowerCase()) ||
          s.title?.toLowerCase().includes(search.toLowerCase()) ||
          s.messages.some((m) =>
            m.content.toLowerCase().includes(search.toLowerCase()),
          ),
      )
    : sessions;

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {search ? "Δεν βρέθηκαν αποτελέσματα" : "Δεν υπάρχουν συνομιλίες"}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((session) => {
        const isExpanded = expandedId === session.id;
        const firstQuestion = session.messages.find((m) => m.role === "user");
        const messageCount = session.messages.length;

        return (
          <div
            key={session.id}
            className="rounded-lg border bg-card overflow-hidden"
          >
            {/* Header row — click to expand */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
              className="flex w-full items-start gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
            >
              <div className="mt-0.5">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {session.userFullName ?? session.userEmail}
                  </span>
                  {session.userFullName && (
                    <span className="text-xs text-muted-foreground">
                      {session.userEmail}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground truncate">
                  {firstQuestion?.content ?? session.title ?? "Χωρίς μηνύματα"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {new Date(session.updatedAt).toLocaleString("el-GR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {messageCount} μην.
                </Badge>
              </div>
            </button>

            {/* Expanded — full conversation */}
            {isExpanded && (
              <div className="border-t bg-muted/30 p-4 space-y-3">
                {session.messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border text-muted-foreground",
                      )}
                    >
                      {msg.role === "user" ? (
                        <User className="h-3.5 w-3.5" />
                      ) : (
                        <Bot className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          {msg.role === "user" ? "Χρήστης" : "AI Assistant"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.createdAt).toLocaleTimeString("el-GR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Actions Tab ─── */

function ActionList({ logs, search }: { logs: AuditLog[]; search: string }) {
  const filtered = search
    ? logs.filter(
        (l) =>
          l.user_email.toLowerCase().includes(search.toLowerCase()) ||
          l.action.toLowerCase().includes(search.toLowerCase()) ||
          (ACTION_LABELS[l.action] ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : logs;

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {search ? "Δεν βρέθηκαν αποτελέσματα" : "Δεν υπάρχουν ενέργειες"}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((log) => (
        <div
          key={log.id}
          className="flex items-center gap-4 rounded-lg px-4 py-3 hover:bg-accent/50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{log.user_email}</span>
              <Badge variant="secondary" className="text-xs">
                {ACTION_LABELS[log.action] ?? log.action}
              </Badge>
            </div>
            {log.details && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {formatDetails(log.action, log.details)}
              </p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(log.created_at).toLocaleString("el-GR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ))}
    </div>
  );
}

function formatDetails(
  action: string,
  details: Record<string, unknown>,
): string {
  switch (action) {
    case "document_upload":
      return `Αρχείο: ${details.title ?? details.file_name ?? "—"}`;
    case "document_delete":
      return `Έγγραφο: ${details.title ?? details.document_id ?? "—"}`;
    case "user_invite":
      return `Email: ${details.invited_email ?? "—"}, Ρόλος: ${details.role ?? "—"}`;
    case "user_update":
    case "role_change":
      return `Χρήστης: ${details.target_user_id ?? "—"}`;
    default:
      return Object.entries(details)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ")
        .slice(0, 100);
  }
}
