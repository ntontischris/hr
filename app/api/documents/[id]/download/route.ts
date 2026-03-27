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

  // Fetch document metadata + content fallback (uses RLS)
  const { data: doc, error: dbError } = await supabase
    .from("documents")
    .select("id, title, content, file_name, file_type")
    .eq("id", id)
    .is("parent_document_id", null)
    .single();

  if (dbError || !doc) {
    return error("Δεν βρέθηκε το έγγραφο", 404);
  }

  // Try to serve original file from storage
  if (doc.file_name) {
    const adminClient = createAdminClient();
    const storagePath = `${doc.id}/${encodeURIComponent(doc.file_name)}`;
    const { data: signedData } = await adminClient.storage
      .from("documents")
      .createSignedUrl(storagePath, 300);

    if (signedData?.signedUrl) {
      const fileRes = await fetch(signedData.signedUrl);
      if (fileRes.ok) {
        const fileBuffer = await fileRes.arrayBuffer();
        const isText = doc.file_type === "text/plain";
        const contentType = isText
          ? "text/plain; charset=utf-8"
          : (doc.file_type ?? "application/octet-stream");
        const encodedName = encodeURIComponent(doc.file_name);

        return new Response(fileBuffer, {
          headers: {
            "Content-Type": contentType,
            "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
          },
        });
      }
    }
  }

  // Fallback: serve extracted text content from database
  if (!doc.content) {
    return error("Δεν υπάρχει περιεχόμενο για αυτό το έγγραφο", 404);
  }

  const encodedTitle = encodeURIComponent(`${doc.title}.txt`);

  return new Response(doc.content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `inline; filename*=UTF-8''${encodedTitle}`,
    },
  });
}
