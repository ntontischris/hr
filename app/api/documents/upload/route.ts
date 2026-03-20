import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UploadDocumentSchema } from "@/lib/validators/documents";
import { processDocument } from "@/lib/documents/processor";
import { checkRateLimit } from "@/lib/rate-limit";
import { error, success } from "@/lib/api/response";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
  }

  // Role check — HR managers and admins only
  const role = user.app_metadata?.role as string | undefined;
  if (role !== "hr_manager" && role !== "admin") {
    return error("Δεν έχετε δικαίωμα μεταφόρτωσης εγγράφων", 403);
  }

  // Rate limit
  const rateLimit = await checkRateLimit({
    userId: user.id,
    endpoint: "document_upload",
    maxRequests: Number(process.env.RATE_LIMIT_UPLOAD_PER_HOUR ?? 20),
    windowMinutes: 60,
  });
  if (!rateLimit.allowed) {
    return error("Υπερβήκατε το όριο μεταφορτώσεων. Δοκιμάστε αργότερα.", 429);
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get("file");
  const title = formData.get("title");
  const category = formData.get("category");
  const accessLevel = formData.get("accessLevel") ?? "all";

  if (!(file instanceof File)) {
    return error("Δεν βρέθηκε αρχείο", 400);
  }

  // File validation
  if (file.size > MAX_FILE_SIZE) {
    return error("Το αρχείο υπερβαίνει τα 10MB", 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return error(
      "Μη αποδεκτός τύπος αρχείου. Επιτρέπονται PDF, DOCX, TXT.",
      400,
    );
  }

  // Validate metadata
  const parsed = UploadDocumentSchema.safeParse({
    title,
    category,
    accessLevel,
  });
  if (!parsed.success) {
    return error("Μη έγκυρα μεταδεδομένα εγγράφου", 400);
  }

  // Determine access level from category
  const sensitiveCategories = ["evaluation", "disciplinary", "payroll"];
  const effectiveAccessLevel = sensitiveCategories.includes(
    parsed.data.category,
  )
    ? "hr_only"
    : parsed.data.accessLevel;

  // Process document: extract → chunk → embed
  let result;
  try {
    result = await processDocument(file);
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Αποτυχία επεξεργασίας εγγράφου";
    return error(message, 422);
  }

  // Insert parent document
  const { data: document, error: insertError } = await supabase
    .from("documents")
    .insert({
      title: parsed.data.title,
      content: result.fullText,
      category: parsed.data.category,
      access_level: effectiveAccessLevel,
      file_name: file.name,
      file_type: file.type,
      created_by: user.id,
      version: 1,
      is_active: true,
    })
    .select("id, title, category, access_level, file_name, version, created_at")
    .single();

  if (insertError || !document) {
    return error("Αποτυχία αποθήκευσης εγγράφου", 500);
  }

  // Bulk insert chunks with embeddings
  const chunkRows = result.chunks.map((content, index) => ({
    parent_document_id: document.id,
    title: `${parsed.data.title} — τμήμα ${index + 1}`,
    content,
    category: parsed.data.category,
    access_level: effectiveAccessLevel,
    file_name: file.name,
    file_type: file.type,
    chunk_index: index,
    embedding: JSON.stringify(result.embeddings[index]),
    created_by: user.id,
    version: 1,
    is_active: true,
  }));

  const { error: chunkError } = await supabase
    .from("documents")
    .insert(chunkRows);

  if (chunkError) {
    // Clean up parent document on chunk insert failure
    await supabase.from("documents").delete().eq("id", document.id);
    return error("Αποτυχία αποθήκευσης τμημάτων εγγράφου", 500);
  }

  // Audit log via service role
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    user_id: user.id,
    user_email: user.email ?? "",
    action: "document_upload",
    details: {
      document_id: document.id,
      title: parsed.data.title,
      category: parsed.data.category,
      chunks: result.chunks.length,
      file_name: file.name,
    },
  });

  return success(document, 201);
}
