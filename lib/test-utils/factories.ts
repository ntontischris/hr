import type {
  Profile,
  Document,
  ChatSession,
  ChatMessage,
  AuditLog,
} from "@/lib/types/database";

function uid(): string {
  return crypto.randomUUID();
}

export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: uid(),
    email: "test@company.gr",
    full_name: "Test User",
    role: "employee",
    department: null,
    avatar_url: null,
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildDocument(overrides: Partial<Document> = {}): Document {
  return {
    id: uid(),
    title: "Test Document",
    content: "Test content",
    category: "policy",
    access_level: "all",
    file_name: null,
    file_type: null,
    embedding: null,
    chunk_index: 0,
    parent_document_id: null,
    version: 1,
    is_active: true,
    metadata: {},
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    created_by: null,
    ...overrides,
  };
}

export function buildChatSession(
  overrides: Partial<ChatSession> = {},
): ChatSession {
  return {
    id: uid(),
    user_id: uid(),
    title: "Test Session",
    is_archived: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildChatMessage(
  overrides: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: uid(),
    session_id: uid(),
    user_id: uid(),
    role: "user",
    content: "Hello",
    sources_used: [],
    tokens_used: null,
    model_used: null,
    response_time_ms: null,
    feedback: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function buildAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    id: uid(),
    user_id: uid(),
    user_email: "test@company.gr",
    action: "chat",
    details: {},
    ip_address: null,
    user_agent: null,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}
