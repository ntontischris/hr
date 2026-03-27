import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpdateDocumentSchema } from "@/lib/validators/documents";
import { UuidSchema } from "@/lib/validators/common";
import { error, success } from "@/lib/api/response";
import type { UpdateTables } from "@/lib/types/database";

type DocumentUpdate = UpdateTables<"documents">;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  if (!UuidSchema.safeParse(id).success) {
    return error("Μη έγκυρο αναγνωριστικό", 400);
  }

  const { data: document, error: dbError } = await supabase
    .from("documents")
    .select(
      "id, title, content, category, access_level, file_name, file_type, version, is_active, metadata, created_at, updated_at, created_by",
    )
    .eq("id", id)
    .is("parent_document_id", null)
    .single();

  if (dbError || !document) {
    return error("Δεν βρέθηκε το έγγραφο", 404);
  }

  return success({ document });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  const userRole = user.app_metadata?.user_role as string | undefined;
  if (!userRole || !["hr_manager", "admin"].includes(userRole)) {
    return error("Δεν έχετε δικαίωμα επεξεργασίας", 403);
  }

  if (!UuidSchema.safeParse(id).success) {
    return error("Μη έγκυρο αναγνωριστικό", 400);
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateDocumentSchema.safeParse(body);
  if (!parsed.success) {
    return error("Μη έγκυρα δεδομένα", 400, { issues: parsed.error.issues });
  }

  const updates: DocumentUpdate = { updated_at: new Date().toISOString() };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.category !== undefined)
    updates.category = parsed.data.category;
  if (parsed.data.accessLevel !== undefined)
    updates.access_level = parsed.data.accessLevel;
  if (parsed.data.isActive !== undefined)
    updates.is_active = parsed.data.isActive;

  const { data: updated, error: dbError } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .select("id, title, category, access_level, is_active, updated_at")
    .single();

  if (dbError || !updated) {
    return error("Αποτυχία ενημέρωσης", 500);
  }

  // Audit log
  const adminClient = createAdminClient();
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email!,
    action: "document_update",
    details: { document_id: id, changes: parsed.data },
  });

  return success({ document: updated });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  const userRole = user.app_metadata?.user_role as string | undefined;
  if (!userRole || !["hr_manager", "admin"].includes(userRole)) {
    return error("Δεν έχετε δικαίωμα διαγραφής", 403);
  }

  if (!UuidSchema.safeParse(id).success) {
    return error("Μη έγκυρο αναγνωριστικό", 400);
  }

  const adminClient = createAdminClient();

  // Verify document exists
  const { data: doc, error: findError } = await adminClient
    .from("documents")
    .select("id, file_name")
    .eq("id", id)
    .is("parent_document_id", null)
    .single();

  if (findError || !doc) {
    return error("Δεν βρέθηκε το έγγραφο", 404);
  }

  const softDelete: DocumentUpdate = {
    is_active: false,
    updated_at: new Date().toISOString(),
  };

  // Soft delete parent document
  const { error: dbError } = await adminClient
    .from("documents")
    .update(softDelete)
    .eq("id", id);

  if (dbError) {
    return error("Αποτυχία διαγραφής", 500);
  }

  // Also soft-delete child chunks
  await adminClient
    .from("documents")
    .update(softDelete)
    .eq("parent_document_id", id);
  await adminClient.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email!,
    action: "document_delete",
    details: { document_id: id },
  });

  return success({ deleted: true });
}
