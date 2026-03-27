import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UuidSchema } from "@/lib/validators/common";
import { error } from "@/lib/api/response";

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

  // Fetch document metadata (uses RLS — employees only see public docs)
  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .select("id, file_name, file_type")
    .eq("id", id)
    .is("parent_document_id", null)
    .single();

  if (dbError || !doc) {
    return error("Δεν βρέθηκε το έγγραφο", 404);
  }

  if (!doc.file_name) {
    return error("Δεν υπάρχει αρχείο για αυτό το έγγραφο", 404);
  }

  // Generate signed URL via admin client (bypasses storage RLS for simplicity)
  const adminClient = createAdminClient();
  const storagePath = `${doc.id}/${doc.file_name}`;
  const { data: signedData, error: signError } = await adminClient.storage
    .from("documents")
    .createSignedUrl(storagePath, 60); // 60 seconds expiry

  if (signError || !signedData?.signedUrl) {
    console.error("[download] Signed URL failed:", signError?.message);
    return error("Αδυναμία δημιουργίας συνδέσμου λήψης", 500);
  }

  return Response.redirect(signedData.signedUrl, 302);
}
