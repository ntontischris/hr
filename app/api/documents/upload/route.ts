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
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return error("Μη εξουσιοδοτημένη πρόσβαση", 401);
    }

    // Role check — HR managers and admins only
    const role = user.app_metadata?.user_role as string | undefined;
    if (role !== "hr_manager" && role !== "admin") {
      return error("Δεν έχετε δικαίωμα μεταφόρτωσης εγγράφων", 403);
    }

    // Rate limit — skip if table not available
    let rateLimit = { allowed: true, remaining: 99 };
    try {
      rateLimit = await checkRateLimit({
        userId: user.id,
        endpoint: "document_upload",
        maxRequests: Number(process.env.RATE_LIMIT_UPLOAD_PER_HOUR ?? 20),
        windowMinutes: 60,
      });
    } catch (rlError) {
      console.error("[upload] Rate limit check failed (skipping):", rlError);
    }
    if (!rateLimit.allowed) {
      return error(
        "Υπερβήκατε το όριο μεταφορτώσεων. Δοκιμάστε αργότερα.",
        429,
      );
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
      console.error("[upload] Document processing failed:", e);
      const message =
        e instanceof Error ? e.message : "Αποτυχία επεξεργασίας εγγράφου";
      return error(message, 422);
    }

    // Use admin client for document inserts — RLS is enforced via server-side role check above
    const adminClient = createAdminClient();

    // Insert parent document
    const { data: document, error: insertError } = await adminClient
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
      .select(
        "id, title, category, access_level, file_name, version, created_at",
      )
      .single();

    if (insertError || !document) {
      console.error(
        "[upload] Document insert failed:",
        insertError?.message,
        insertError?.code,
        insertError?.details,
      );
      return error("Αποτυχία αποθήκευσης εγγράφου", 500);
    }

    // Upload original file to Supabase Storage
    // Supabase Storage doesn't allow non-ASCII chars in keys
    const safeFileName = encodeURIComponent(file.name);
    const storagePath = `${document.id}/${safeFileName}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const contentType =
      file.type === "text/plain" ? "text/plain; charset=utf-8" : file.type;
    const { error: storageError } = await adminClient.storage
      .from("documents")
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: false,
      });

    if (storageError) {
      console.error("[upload] Storage upload failed:", {
        message: storageError.message,
        path: storagePath,
        docId: document.id,
      });
      // Non-blocking — document is still usable without the file
    } else {
      console.log("[upload] File stored:", storagePath);
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

    const { error: chunkError } = await adminClient
      .from("documents")
      .insert(chunkRows);

    if (chunkError) {
      // Clean up parent document on chunk insert failure
      await adminClient.from("documents").delete().eq("id", document.id);
      return error("Αποτυχία αποθήκευσης τμημάτων εγγράφου", 500);
    }

    // Audit log via service role
    await adminClient.from("audit_logs").insert({
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[upload] Unhandled error:", msg);
    return error(`Upload failed: ${msg}`, 500);
  }
}
